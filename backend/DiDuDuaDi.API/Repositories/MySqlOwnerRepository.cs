using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class MySqlOwnerRepository(IDbConnectionFactory connectionFactory) : IOwnerRepository
{
    public OwnerShopDashboard? GetDashboard(string username)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return null;
        }

        return BuildDashboard(connection, shop);
    }

    public OwnerShopDashboard? UpdateShopProfile(string username, UpdateShopProfileRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return null;
        }

        const string sql = """
            UPDATE shops
            SET
                name = @ShopName,
                description = @Description,
                pending_intro = @PendingIntroduction,
                intro_review_status = CASE
                    WHEN COALESCE(@PendingIntroduction, '') = '' THEN intro_review_status
                    ELSE 'pending'
                END,
                address_line = @AddressLine,
                opening_hours = @OpeningHours,
                phone = @Phone,
                image_url = @ImageUrl
            WHERE id = @ShopId;
            """;

        connection.Execute(sql, new
        {
            ShopId = shop.ShopId,
            request.ShopName,
            request.Description,
            request.PendingIntroduction,
            request.AddressLine,
            request.OpeningHours,
            request.Phone,
            request.ImageUrl
        });

        return BuildDashboard(connection, shop);
    }

    public MenuItemSummary? CreateMenuItem(string username, UpsertMenuItemRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return null;
        }

        const string sql = """
            INSERT INTO menu_items (
                shop_id,
                name,
                description,
                price,
                image_url,
                is_available,
                display_order
            )
            VALUES (
                @ShopId,
                @Name,
                @Description,
                @Price,
                @ImageUrl,
                @IsAvailable,
                @DisplayOrder
            );
            """;

        connection.Execute(sql, new
        {
            ShopId = shop.ShopId,
            request.Name,
            request.Description,
            request.Price,
            request.ImageUrl,
            request.IsAvailable,
            request.DisplayOrder
        });
        var menuItemId = connection.ExecuteScalar<long>("SELECT LAST_INSERT_ID();");

        return GetMenuItem(connection, shop.ShopId, menuItemId);
    }

    public MenuItemSummary? UpdateMenuItem(string username, long menuItemId, UpsertMenuItemRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return null;
        }

        const string sql = """
            UPDATE menu_items
            SET
                name = @Name,
                description = @Description,
                price = @Price,
                image_url = @ImageUrl,
                is_available = @IsAvailable,
                display_order = @DisplayOrder
            WHERE id = @MenuItemId
              AND shop_id = @ShopId;
            """;

        var updated = connection.Execute(sql, new
        {
            MenuItemId = menuItemId,
            ShopId = shop.ShopId,
            request.Name,
            request.Description,
            request.Price,
            request.ImageUrl,
            request.IsAvailable,
            request.DisplayOrder
        });

        return updated > 0 ? GetMenuItem(connection, shop.ShopId, menuItemId) : null;
    }

    public bool DeleteMenuItem(string username, long menuItemId)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return false;
        }

        const string sql = """
            DELETE FROM menu_items
            WHERE id = @MenuItemId
              AND shop_id = @ShopId;
            """;

        return connection.Execute(sql, new { MenuItemId = menuItemId, ShopId = shop.ShopId }) > 0;
    }

    public ClaimCodeSummary? CreateClaimCode(string username, CreateClaimCodeRequest request)
    {
        using var connection = connectionFactory.CreateConnection();
        var shop = GetShopRow(connection, username);
        if (shop is null)
        {
            return null;
        }

        var code = $"VK{Random.Shared.Next(100000, 999999)}";

        const string sql = """
            INSERT INTO cash_claim_codes (
                shop_id,
                code,
                amount,
                status,
                note,
                expires_at
            )
            VALUES (
                @ShopId,
                @Code,
                @Amount,
                'issued',
                @Note,
                DATE_ADD(CURRENT_TIMESTAMP, INTERVAL @ExpireAfterHours HOUR)
            );
            """;

        connection.Execute(sql, new
        {
            ShopId = shop.ShopId,
            Code = code,
            request.Amount,
            request.Note,
            request.ExpireAfterHours
        });
        var claimCodeId = connection.ExecuteScalar<long>("SELECT LAST_INSERT_ID();");

        return GetClaimCode(connection, shop.ShopId, claimCodeId);
    }

    private static OwnerShopDashboard BuildDashboard(System.Data.IDbConnection connection, ShopRow shop)
    {
        var dashboard = new OwnerShopDashboard
        {
            ShopId = shop.ShopId,
            ShopName = shop.ShopName,
            AddressLine = shop.AddressLine,
            Description = shop.Description,
            ApprovedIntroduction = shop.ApprovedIntroduction,
            PendingIntroduction = shop.PendingIntroduction,
            IntroReviewStatus = shop.IntroReviewStatus,
            OpeningHours = shop.OpeningHours,
            Phone = shop.Phone,
            ImageUrl = shop.ImageUrl
        };

        dashboard.MenuItems = connection.Query<MenuItemSummary>(
            """
            SELECT
                id AS Id,
                name AS Name,
                description AS Description,
                price AS Price,
                image_url AS ImageUrl,
                is_available AS IsAvailable,
                display_order AS DisplayOrder
            FROM menu_items
            WHERE shop_id = @ShopId
            ORDER BY display_order ASC, id ASC;
            """,
            new { shop.ShopId }).ToList();

        dashboard.RecentClaimCodes = connection.Query<ClaimCodeSummary>(
            """
            SELECT
                id AS Id,
                code AS Code,
                amount AS Amount,
                status AS Status,
                note AS Note,
                issued_at AS IssuedAt,
                expires_at AS ExpiresAt
            FROM cash_claim_codes
            WHERE shop_id = @ShopId
            ORDER BY issued_at DESC
            LIMIT 6;
            """,
            new { shop.ShopId }).ToList();

        dashboard.Stats = connection.QuerySingle<ShopStatsSummary>(
            """
            SELECT
                (SELECT COUNT(*) FROM shop_visit_events WHERE shop_id = @ShopId) AS TotalVisitCount,
                (SELECT COUNT(*) FROM audio_play_events WHERE shop_id = @ShopId) AS TotalAudioPlayCount,
                (SELECT COUNT(*) FROM cash_claim_codes WHERE shop_id = @ShopId) AS ClaimCodesIssuedCount,
                (SELECT COUNT(*) FROM shop_visit_events WHERE shop_id = @ShopId AND DATE(created_at) = CURRENT_DATE()) AS VisitCountToday,
                (SELECT COUNT(*) FROM audio_play_events WHERE shop_id = @ShopId AND DATE(created_at) = CURRENT_DATE()) AS AudioPlayCountToday;
            """,
            new { shop.ShopId });

        return dashboard;
    }

    private static ShopRow? GetShopRow(System.Data.IDbConnection connection, string username) =>
        connection.QuerySingleOrDefault<ShopRow>(
            """
            SELECT
                s.id AS ShopId,
                s.name AS ShopName,
                s.address_line AS AddressLine,
                s.description AS Description,
                s.approved_intro AS ApprovedIntroduction,
                s.pending_intro AS PendingIntroduction,
                s.intro_review_status AS IntroReviewStatus,
                s.opening_hours AS OpeningHours,
                s.phone AS Phone,
                s.image_url AS ImageUrl
            FROM shops s
            INNER JOIN accounts a ON a.id = s.owner_account_id
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @username
              AND r.code = 'owner'
            LIMIT 1;
            """,
            new { username });

    private static MenuItemSummary? GetMenuItem(System.Data.IDbConnection connection, Guid shopId, long menuItemId) =>
        connection.QuerySingleOrDefault<MenuItemSummary>(
            """
            SELECT
                id AS Id,
                name AS Name,
                description AS Description,
                price AS Price,
                image_url AS ImageUrl,
                is_available AS IsAvailable,
                display_order AS DisplayOrder
            FROM menu_items
            WHERE id = @MenuItemId
              AND shop_id = @ShopId
            LIMIT 1;
            """,
            new { MenuItemId = menuItemId, ShopId = shopId });

    private static ClaimCodeSummary? GetClaimCode(System.Data.IDbConnection connection, Guid shopId, long claimCodeId) =>
        connection.QuerySingleOrDefault<ClaimCodeSummary>(
            """
            SELECT
                id AS Id,
                code AS Code,
                amount AS Amount,
                status AS Status,
                note AS Note,
                issued_at AS IssuedAt,
                expires_at AS ExpiresAt
            FROM cash_claim_codes
            WHERE id = @ClaimCodeId
              AND shop_id = @ShopId
            LIMIT 1;
            """,
            new { ClaimCodeId = claimCodeId, ShopId = shopId });

    private sealed class ShopRow
    {
        public Guid ShopId { get; init; }
        public string ShopName { get; init; } = string.Empty;
        public string AddressLine { get; init; } = string.Empty;
        public string? Description { get; init; }
        public string? ApprovedIntroduction { get; init; }
        public string? PendingIntroduction { get; init; }
        public string IntroReviewStatus { get; init; } = "approved";
        public string? OpeningHours { get; init; }
        public string? Phone { get; init; }
        public string? ImageUrl { get; init; }
    }
}
