using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;
using System.Text.Json;
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
/* Commented out FoodTour code to avoid table error */
// ✅ CREATE
public async Task CreateFoodTourAsync(FoodTour tour)
{
    using var connection = connectionFactory.CreateConnection();

    var sql = """
        INSERT INTO food_tours (id, title, description, category, image_url, steps)
        VALUES (@Id, @Title, @Description, @Category, @ImageUrl, @Steps)
    """;

    await connection.ExecuteAsync(sql, new
    {
        Id = tour.Id.ToString(),
        Title = JsonSerializer.Serialize(tour.Title),
        Description = JsonSerializer.Serialize(tour.Description),
        tour.Category,
        tour.ImageUrl,
        Steps = JsonSerializer.Serialize(tour.Steps)
    });
}
public async Task<IReadOnlyList<FoodTour>> GetFoodToursAsync()
{
    using var connection = connectionFactory.CreateConnection();

    var sql = "SELECT * FROM food_tours";

    var data = await connection.QueryAsync<dynamic>(sql);

    return data.Select(x =>
    {
        string stepsJson = "";

        if (x.steps != null)
        {
            // 🔥 Fix byte[] -> string
            if (x.steps is byte[] bytes)
                stepsJson = System.Text.Encoding.UTF8.GetString(bytes);
            else
                stepsJson = x.steps.ToString();
        }

        return new FoodTour
        {
            Id = Guid.Parse(x.id.ToString()),
            Title = JsonSerializer.Deserialize<LocalizedString>(x.title?.ToString() ?? "{}") 
        ?? new LocalizedString(),
            Description = JsonSerializer.Deserialize<LocalizedString>(x.description?.ToString() ?? "{}") 
        ?? new LocalizedString(),
            Category = x.category,
            ImageUrl = x.image_url,
           Steps = string.IsNullOrEmpty(stepsJson)
    ? new List<FoodTourStep>()
    : JsonSerializer.Deserialize<List<FoodTourStep>>(stepsJson)
        ?? new List<FoodTourStep>()
        };
    }).ToList();
}
   public async Task DeleteFoodTourAsync(Guid id)
{
    using var connection = connectionFactory.CreateConnection();

    await connection.ExecuteAsync(
        "DELETE FROM food_tours WHERE id = @id",
        new { id = id.ToString() }
    );
}
 public async Task<FoodTour?> GetFoodTourByIdAsync(Guid id)
{
    using var connection = connectionFactory.CreateConnection();

    var sql = "SELECT * FROM food_tours WHERE id = @id";

    var x = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { id });

    if (x == null) return null;

    string stepsJson = "";

    if (x.steps != null)
    {
        if (x.steps is byte[] bytes)
            stepsJson = System.Text.Encoding.UTF8.GetString(bytes);
        else
            stepsJson = x.steps.ToString();
    }

    return new FoodTour
    {
        Id = Guid.Parse(x.id.ToString()),
        Title = JsonSerializer.Deserialize<LocalizedString>(x.title?.ToString() ?? "{}") 
        ?? new LocalizedString(),
        Description = JsonSerializer.Deserialize<LocalizedString>(x.description?.ToString() ?? "{}") 
        ?? new LocalizedString(),
        Category = x.category,
        ImageUrl = x.image_url,
       Steps = string.IsNullOrEmpty(stepsJson)
    ? new List<FoodTourStep>()
    : JsonSerializer.Deserialize<List<FoodTourStep>>(stepsJson)
        ?? new List<FoodTourStep>()
    };
}
public async Task UpdateFoodTourAsync(FoodTour tour)
{
    using var connection = connectionFactory.CreateConnection();

    var sql = """
        UPDATE food_tours
        SET title = @Title,
            description = @Description,
            category = @Category,
            image_url = @ImageUrl,
            steps = @Steps
        WHERE id = @Id
    """;

    await connection.ExecuteAsync(sql, new
    {
        Id = tour.Id.ToString(),
        Title = JsonSerializer.Serialize(tour.Title),
        Description = JsonSerializer.Serialize(tour.Description),
        tour.Category,
        tour.ImageUrl,
        Steps = JsonSerializer.Serialize(tour.Steps)
    });
}
}
