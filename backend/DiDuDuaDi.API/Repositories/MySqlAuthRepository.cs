using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;
using System.Text;

namespace DiDuDuaDi.API.Repositories;

public class MySqlAuthRepository(IDbConnectionFactory connectionFactory) : IAuthRepository
{
    private const decimal OwnerUpgradeFeeAmount = 299000m;
    private const string PaymentBankCode = "VCB";
    private const string PaymentBankAccountNumber = "1012673499";
    private const string PaymentAccountName = "DiDuDuaDi Seminar";

    public AuthUser? ValidateCredentials(string username, string password)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
            SELECT
                a.username AS Username,
                r.code AS Role,
                a.display_name AS DisplayName,
                a.password_hash AS PasswordHash
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @username
              AND a.is_active = 1
            LIMIT 1;
            """;

        var row = connection.QuerySingleOrDefault<AuthRow>(sql, new { username });
        if (row is null || !PasswordMatches(row.PasswordHash, password))
        {
            return null;
        }

        connection.Execute(
            "UPDATE accounts SET last_login_at = CURRENT_TIMESTAMP WHERE username = @username;",
            new { username });

        return new AuthUser(row.Username, row.Role, row.DisplayName);
    }

    public AuthUser? Register(RegisterRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        var username = request.Username.Trim();
        var displayName = request.DisplayName.Trim();
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        var existed = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM accounts WHERE username = @Username;",
            new { Username = username });

        if (existed > 0)
        {
            return null;
        }

        var userRoleId = connection.ExecuteScalar<int>(
            "SELECT id FROM roles WHERE code = 'user' LIMIT 1;");

        var accountId = Guid.NewGuid().ToString();
        connection.Execute(
            """
            INSERT INTO accounts (
                id,
                username,
                password_hash,
                display_name,
                email,
                role_id,
                is_active
            )
            VALUES (
                @Id,
                @Username,
                @PasswordHash,
                @DisplayName,
                @Email,
                @RoleId,
                1
            );
            """,
            new
            {
                Id = accountId,
                Username = username,
                PasswordHash = request.Password,
                DisplayName = displayName,
                Email = email,
                RoleId = userRoleId
            });

        return new AuthUser(username, "user", displayName);
    }

    public OwnerUpgradeRequestSummary? CreateOwnerUpgradeRequest(CreateOwnerUpgradeRequest request)
    {
        using var connection = connectionFactory.CreateConnection();

        var account = connection.QuerySingleOrDefault<AccountRow>(
            """
            SELECT a.id AS AccountId, a.username AS Username, a.display_name AS DisplayName, r.code AS Role
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @Username
              AND a.is_active = 1
            LIMIT 1;
            """,
            new { request.Username });

        if (account is null || account.Role != "user")
        {
            return null;
        }

        var hasPending = connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM owner_upgrade_requests
            WHERE account_id = @AccountId
              AND status IN ('pending', 'payment_pending');
            """,
            new { account.AccountId });

        if (hasPending > 0)
        {
            return null;
        }

        connection.Execute(
            """
            INSERT INTO owner_upgrade_requests (
                account_id,
                shop_name,
                address_line,
                id_card_image_url,
                business_license_image_url,
                note,
                status,
                submitted_at
            )
            VALUES (
                @AccountId,
                @ShopName,
                @AddressLine,
                @IdCardImageUrl,
                @BusinessLicenseImageUrl,
                @Note,
                'pending',
                CURRENT_TIMESTAMP
            );
            """,
            new
            {
                account.AccountId,
                request.ShopName,
                request.AddressLine,
                request.IdCardImageUrl,
                request.BusinessLicenseImageUrl,
                request.Note
            });

        var requestId = connection.ExecuteScalar<long>("SELECT LAST_INSERT_ID();");
        return GetOwnerUpgradeRequestById(connection, requestId);
    }

    public string? GetRoleCodeByUsername(string username)
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.ExecuteScalar<string?>(
            """
            SELECT r.code
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @username
              AND a.is_active = 1
            LIMIT 1;
            """,
            new { username });
    }

    public bool HasPendingOwnerUpgradeRequest(string username)
    {
        using var connection = connectionFactory.CreateConnection();

        var count = connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM owner_upgrade_requests our
            INNER JOIN accounts a ON a.id = our.account_id
            WHERE a.username = @username
              AND our.status IN ('pending', 'payment_pending');
            """,
            new { username });

        return count > 0;
    }

    public OwnerUpgradeRequestSummary? GetLatestOwnerUpgradeRequest(string username)
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.QuerySingleOrDefault<OwnerUpgradeRequestSummary>(
            BuildOwnerUpgradeRequestSelect("a.username = @username", singleResult: true),
            new { username });
    }

    public IReadOnlyList<OwnerUpgradeRequestSummary> GetOwnerUpgradeRequests(string? status)
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.Query<OwnerUpgradeRequestSummary>(
            BuildOwnerUpgradeRequestSelect("(@status IS NULL OR our.status = @status)"),
            new { status }).ToList();
    }

    public OwnerUpgradeRequestSummary? ApproveOwnerUpgradeRequest(long requestId, string adminUsername)
        => ReviewOwnerUpgradeRequest(requestId, adminUsername, "approve", null);

    public OwnerUpgradeRequestSummary? ReviewOwnerUpgradeRequest(long requestId, string adminUsername, string action, string? reason)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var adminAccountId = connection.QuerySingleOrDefault<Guid?>(
            """
            SELECT a.id
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @adminUsername
              AND r.code = 'admin'
            LIMIT 1;
            """,
            new { adminUsername },
            tx);

        if (adminAccountId is null || adminAccountId == Guid.Empty)
        {
            tx.Rollback();
            return null;
        }

        var normalizedAction = action.Trim().ToLowerInvariant();
        if (normalizedAction is not ("approve" or "reject"))
        {
            tx.Rollback();
            return null;
        }

        var req = connection.QuerySingleOrDefault<PendingOwnerUpgradeRequest>(
            """
            SELECT
                our.id AS RequestId,
                our.account_id AS AccountId,
                our.shop_name AS ShopName,
                our.address_line AS AddressLine,
                our.status AS Status,
                a.display_name AS DisplayName
            FROM owner_upgrade_requests our
            INNER JOIN accounts a ON a.id = our.account_id
            WHERE our.id = @requestId
            LIMIT 1;
            """,
            new { requestId },
            tx);

        if (req is null || req.Status != "pending")
        {
            tx.Rollback();
            return null;
        }

        if (normalizedAction == "approve")
        {
            var paymentReferenceCode = BuildPaymentReferenceCode(requestId);
            var paymentQrContent =
                $"NANG QUYEN CHU QUAN | Fee: {OwnerUpgradeFeeAmount:0} VND | Ref: {paymentReferenceCode}";
            var paymentQrImageUrl = BuildPaymentQrImageUrl(paymentReferenceCode, OwnerUpgradeFeeAmount);

            connection.Execute(
                """
                UPDATE owner_upgrade_requests
                SET
                    status = 'payment_pending',
                    reviewed_by_account_id = @reviewedByAccountId,
                    reviewed_at = CURRENT_TIMESTAMP,
                    review_note = @ReviewNote,
                    upgrade_fee_amount = @UpgradeFeeAmount,
                    payment_reference_code = @PaymentReferenceCode,
                    payment_qr_content = @PaymentQrContent,
                    payment_qr_image_url = @PaymentQrImageUrl,
                    payment_requested_at = CURRENT_TIMESTAMP
                WHERE id = @requestId;
                """,
                new
                {
                    requestId,
                    reviewedByAccountId = adminAccountId,
                    ReviewNote = reason,
                    UpgradeFeeAmount = OwnerUpgradeFeeAmount,
                    PaymentReferenceCode = paymentReferenceCode,
                    PaymentQrContent = paymentQrContent,
                    PaymentQrImageUrl = paymentQrImageUrl
                },
                tx);
        }
        else
        {
            connection.Execute(
                """
                UPDATE owner_upgrade_requests
                SET
                    status = 'rejected',
                    reviewed_by_account_id = @reviewedByAccountId,
                    reviewed_at = CURRENT_TIMESTAMP,
                    review_note = @ReviewNote
                WHERE id = @requestId;
                """,
                new
                {
                    requestId,
                    reviewedByAccountId = adminAccountId,
                    ReviewNote = reason
                },
                tx);
        }

        tx.Commit();
        return GetOwnerUpgradeRequestById(connection, requestId);
    }

    public OwnerUpgradeRequestSummary? ConfirmOwnerUpgradePayment(long requestId, string adminUsername)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var adminAccountId = connection.QuerySingleOrDefault<Guid?>(
            """
            SELECT a.id
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @adminUsername
              AND r.code = 'admin'
            LIMIT 1;
            """,
            new { adminUsername },
            tx);

        if (adminAccountId is null || adminAccountId == Guid.Empty)
        {
            tx.Rollback();
            return null;
        }

        var req = connection.QuerySingleOrDefault<PendingOwnerUpgradeRequest>(
            """
            SELECT
                our.id AS RequestId,
                our.account_id AS AccountId,
                our.shop_name AS ShopName,
                our.address_line AS AddressLine,
                our.status AS Status,
                a.display_name AS DisplayName
            FROM owner_upgrade_requests our
            INNER JOIN accounts a ON a.id = our.account_id
            WHERE our.id = @requestId
            LIMIT 1;
            """,
            new { requestId },
            tx);

        if (req is null || req.Status != "payment_pending")
        {
            tx.Rollback();
            return null;
        }

        ActivateOwnerRoleAndShop(connection, tx, req);

        connection.Execute(
            """
            UPDATE owner_upgrade_requests
            SET
                status = 'approved',
                payment_confirmed_at = CURRENT_TIMESTAMP,
                activated_at = CURRENT_TIMESTAMP
            WHERE id = @requestId;
            """,
            new { requestId },
            tx);

        tx.Commit();
        return GetOwnerUpgradeRequestById(connection, requestId);
    }

    public OwnerUpgradeRequestSummary? CancelOwnerUpgradePayment(long requestId, string adminUsername)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var adminAccountId = connection.QuerySingleOrDefault<Guid?>(
            """
            SELECT a.id
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @adminUsername
              AND r.code = 'admin'
            LIMIT 1;
            """,
            new { adminUsername },
            tx);

        if (adminAccountId is null || adminAccountId == Guid.Empty)
        {
            tx.Rollback();
            return null;
        }

        var req = connection.QuerySingleOrDefault<PendingOwnerUpgradeRequest>(
            """
            SELECT
                our.id AS RequestId,
                our.account_id AS AccountId,
                our.shop_name AS ShopName,
                our.address_line AS AddressLine,
                our.status AS Status,
                a.display_name AS DisplayName
            FROM owner_upgrade_requests our
            INNER JOIN accounts a ON a.id = our.account_id
            WHERE our.id = @requestId
            LIMIT 1;
            """,
            new { requestId },
            tx);

        if (req is null || req.Status != "payment_pending")
        {
            tx.Rollback();
            return null;
        }

        connection.Execute(
            """
            UPDATE owner_upgrade_requests
            SET
                status = 'pending',
                reviewed_by_account_id = NULL,
                reviewed_at = NULL,
                review_note = NULL,
                upgrade_fee_amount = NULL,
                payment_reference_code = NULL,
                payment_qr_content = NULL,
                payment_qr_image_url = NULL,
                payment_requested_at = NULL,
                payment_confirmed_at = NULL,
                activated_at = NULL
            WHERE id = @requestId;
            """,
            new { requestId },
            tx);

        tx.Commit();
        return GetOwnerUpgradeRequestById(connection, requestId);
    }

    private static bool PasswordMatches(string passwordHash, string password)
    {
        // For this seminar build we allow plain-text demo passwords in the seed file.
        // Replace this with BCrypt/Argon2 verification before going to production.
        return string.Equals(passwordHash, password, StringComparison.Ordinal);
    }

    private static OwnerUpgradeRequestSummary? GetOwnerUpgradeRequestById(System.Data.IDbConnection connection, long requestId)
    {
        return connection.QuerySingleOrDefault<OwnerUpgradeRequestSummary>(
            BuildOwnerUpgradeRequestSelect("our.id = @requestId", singleResult: true),
            new { requestId });
    }

    private static string BuildOwnerUpgradeRequestSelect(string whereClause, bool singleResult = false) =>
        $"""
        SELECT
            our.id AS Id,
            a.username AS Username,
            a.display_name AS DisplayName,
            our.shop_name AS ShopName,
            our.address_line AS AddressLine,
            our.id_card_image_url AS IdCardImageUrl,
            our.business_license_image_url AS BusinessLicenseImageUrl,
            our.note AS Note,
            our.status AS Status,
            our.submitted_at AS SubmittedAt,
            our.reviewed_at AS ReviewedAt,
            reviewer.username AS ReviewedBy,
            our.review_note AS ReviewNote,
            our.upgrade_fee_amount AS UpgradeFeeAmount,
            our.payment_reference_code AS PaymentReferenceCode,
            our.payment_qr_content AS PaymentQrContent,
            our.payment_qr_image_url AS PaymentQrImageUrl,
            our.payment_requested_at AS PaymentRequestedAt,
            our.payment_confirmed_at AS PaymentConfirmedAt,
            our.activated_at AS ActivatedAt
        FROM owner_upgrade_requests our
        INNER JOIN accounts a ON a.id = our.account_id
        LEFT JOIN accounts reviewer ON reviewer.id = our.reviewed_by_account_id
        WHERE {whereClause}
        ORDER BY our.submitted_at DESC
        {(singleResult ? "LIMIT 1" : string.Empty)};
        """;

    private static string BuildPaymentReferenceCode(long requestId)
        => $"OWNERUP-{requestId:D6}";

    private static string BuildPaymentQrImageUrl(string paymentReferenceCode, decimal amount)
    {
        var encodedInfo = Uri.EscapeDataString(paymentReferenceCode);
        var encodedAccountName = Uri.EscapeDataString(PaymentAccountName);
        return $"https://img.vietqr.io/image/{PaymentBankCode}-{PaymentBankAccountNumber}-compact2.png?amount={amount:0}&addInfo={encodedInfo}&accountName={encodedAccountName}";
    }

    private static void ActivateOwnerRoleAndShop(
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction tx,
        PendingOwnerUpgradeRequest req)
    {
        var ownerRoleId = connection.ExecuteScalar<int>(
            "SELECT id FROM roles WHERE code = 'owner' LIMIT 1;",
            transaction: tx);

        connection.Execute(
            "UPDATE accounts SET role_id = @ownerRoleId WHERE id = @accountId;",
            new { ownerRoleId, accountId = req.AccountId },
            tx);

        var hasShop = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM shops WHERE owner_account_id = @accountId;",
            new { accountId = req.AccountId },
            tx);

        if (hasShop > 0)
        {
            return;
        }

        var shopId = Guid.NewGuid().ToString();
        var slug = BuildSlug(req.ShopName);

        connection.Execute(
            """
            INSERT INTO shops (
                id,
                owner_account_id,
                name,
                slug,
                description,
                approved_intro,
                pending_intro,
                intro_review_status,
                address_line,
                latitude,
                longitude,
                opening_hours,
                is_active
            )
            VALUES (
                @Id,
                @OwnerAccountId,
                @Name,
                @Slug,
                @Description,
                @ApprovedIntro,
                NULL,
                'approved',
                @AddressLine,
                10.75855600,
                106.70328400,
                '15:00 - 23:00',
                1
            );
            """,
            new
            {
                Id = shopId,
                OwnerAccountId = req.AccountId,
                Name = req.ShopName,
                Slug = EnsureUniqueSlug(connection, tx, slug),
                Description = $"Quyen chu quan duoc phe duyet cho {req.ShopName}.",
                ApprovedIntro = $"{req.DisplayName} vua tro thanh chu quan trong he thong.",
                req.AddressLine
            },
            tx);
    }

    private static string BuildSlug(string value)
    {
        var sb = new StringBuilder();
        var previousDash = false;

        foreach (var ch in value.ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                previousDash = false;
            }
            else if (!previousDash)
            {
                sb.Append('-');
                previousDash = true;
            }
        }

        var slug = sb.ToString().Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? "shop" : slug;
    }

    private static string EnsureUniqueSlug(System.Data.IDbConnection connection, System.Data.IDbTransaction tx, string baseSlug)
    {
        var slug = baseSlug;
        var suffix = 1;

        while (connection.ExecuteScalar<int>("SELECT COUNT(*) FROM shops WHERE slug = @slug;", new { slug }, tx) > 0)
        {
            suffix++;
            slug = $"{baseSlug}-{suffix}";
        }

        return slug;
    }

    private sealed record AuthRow(string Username, string Role, string DisplayName, string PasswordHash);
    private sealed record AccountRow(Guid AccountId, string Username, string DisplayName, string Role);

    private sealed class PendingOwnerUpgradeRequest
    {
        public ulong RequestId { get; init; }
        public Guid AccountId { get; init; }
        public string ShopName { get; init; } = string.Empty;
        public string AddressLine { get; init; } = string.Empty;
        public string Status { get; init; } = string.Empty;
        public string DisplayName { get; init; } = string.Empty;
    }
}
