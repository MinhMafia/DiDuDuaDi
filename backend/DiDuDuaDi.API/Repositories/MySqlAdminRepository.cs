using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class MySqlAdminRepository(IDbConnectionFactory connectionFactory) : IAdminRepository
{
    public IReadOnlyList<AdminShopIntroReviewSummary> GetShopIntroReviews(string? status)
    {
        using var connection = connectionFactory.CreateConnection();

        return connection.Query<AdminShopIntroReviewSummary>(
            """
            SELECT
                s.id AS ShopId,
                s.name AS ShopName,
                a.username AS OwnerUsername,
                a.display_name AS OwnerDisplayName,
                s.address_line AS AddressLine,
                s.approved_intro AS ApprovedIntroduction,
                s.pending_intro AS PendingIntroduction,
                s.intro_review_status AS IntroReviewStatus,
                s.intro_review_note AS ReviewNote
            FROM shops s
            INNER JOIN accounts a ON a.id = s.owner_account_id
            WHERE (@status IS NULL OR s.intro_review_status = @status)
            ORDER BY s.updated_at DESC, s.created_at DESC;
            """,
            new { status }).ToList();
    }

    public AdminShopIntroReviewSummary? ReviewShopIntro(Guid shopId, string adminUsername, string action, string? reason)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var isAdmin = connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @adminUsername
              AND a.is_active = 1
              AND r.code = 'admin';
            """,
            new { adminUsername },
            tx) > 0;

        if (!isAdmin)
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

        if (normalizedAction == "approve")
        {
            connection.Execute(
                """
                UPDATE shops
                SET
                    approved_intro = COALESCE(NULLIF(pending_intro, ''), approved_intro),
                    pending_intro = NULL,
                    intro_review_status = 'approved',
                    intro_review_note = @Reason
                WHERE id = @shopId;
                """,
                new { shopId, Reason = reason },
                tx);
        }
        else
        {
            connection.Execute(
                """
                UPDATE shops
                SET
                    intro_review_status = 'rejected',
                    intro_review_note = @Reason
                WHERE id = @shopId;
                """,
                new { shopId, Reason = reason },
                tx);
        }

        tx.Commit();

        return GetShopIntroReviews(null).FirstOrDefault(item => item.ShopId == shopId);
    }
}
