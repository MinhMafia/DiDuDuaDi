using System.Data;
using System.Text.Json;
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

    public async Task CreateFoodTourAsync(FoodTour tour)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var normalizedTour = NormalizeTour(tour, true);

        await connection.ExecuteAsync(
            """
            INSERT INTO tours (
                id,
                created_by_account_id,
                code,
                name,
                category,
                description,
                estimated_duration_minutes,
                cover_image_url,
                is_active
            )
            VALUES (
                @Id,
                NULL,
                @Code,
                @Name,
                @Category,
                @Description,
                @EstimatedDurationMinutes,
                @CoverImageUrl,
                1
            );
            """,
            new
            {
                Id = normalizedTour.Id.ToString(),
                normalizedTour.Code,
                Name = SerializeLocalizedString(normalizedTour.Title),
                normalizedTour.Category,
                Description = SerializeLocalizedString(normalizedTour.Description),
                normalizedTour.EstimatedDurationMinutes,
                CoverImageUrl = normalizedTour.ImageUrl
            },
            tx);

        await SaveTourStepsAsync(connection, tx, normalizedTour);
        tx.Commit();
    }

    public async Task<IReadOnlyList<FoodTour>> GetFoodToursAsync()
    {
        using var connection = connectionFactory.CreateConnection();

        var tourRows = (await connection.QueryAsync<TourRow>(
            """
            SELECT
                id,
                code,
                category,
                name,
                description,
                estimated_duration_minutes AS EstimatedDurationMinutes,
                cover_image_url AS CoverImageUrl
            FROM tours
            WHERE is_active = 1
            ORDER BY created_at DESC, code ASC;
            """)).ToList();

        if (tourRows.Count == 0)
        {
            return [];
        }

        var tourIds = tourRows.Select(item => item.Id).ToArray();
        var stepRows = (await connection.QueryAsync<TourStepRow>(
            """
            SELECT
                tour_id AS TourId,
                poi_id AS PoiId,
                sort_order AS SortOrder
            FROM tour_pois
            WHERE tour_id IN @tourIds
            ORDER BY tour_id, sort_order;
            """,
            new { tourIds })).ToList();

        return tourRows.Select(row => MapTour(row, stepRows)).ToList();
    }

    public async Task<FoodTour?> GetFoodTourByIdAsync(Guid id)
    {
        using var connection = connectionFactory.CreateConnection();

        var tourRow = await connection.QueryFirstOrDefaultAsync<TourRow>(
            """
            SELECT
                id,
                code,
                category,
                name,
                description,
                estimated_duration_minutes AS EstimatedDurationMinutes,
                cover_image_url AS CoverImageUrl
            FROM tours
            WHERE id = @id
              AND is_active = 1;
            """,
            new { id = id.ToString() });

        if (tourRow == null)
        {
            return null;
        }

        var stepRows = (await connection.QueryAsync<TourStepRow>(
            """
            SELECT
                tour_id AS TourId,
                poi_id AS PoiId,
                sort_order AS SortOrder
            FROM tour_pois
            WHERE tour_id = @id
            ORDER BY sort_order;
            """,
            new { id = id.ToString() })).ToList();

        return MapTour(tourRow, stepRows);
    }

    public async Task UpdateFoodTourAsync(FoodTour tour)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();

        var normalizedTour = NormalizeTour(tour, false);

        await connection.ExecuteAsync(
            """
            UPDATE tours
            SET
                code = @Code,
                name = @Name,
                category = @Category,
                description = @Description,
                estimated_duration_minutes = @EstimatedDurationMinutes,
                cover_image_url = @CoverImageUrl,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @Id;
            """,
            new
            {
                Id = normalizedTour.Id.ToString(),
                normalizedTour.Code,
                Name = SerializeLocalizedString(normalizedTour.Title),
                normalizedTour.Category,
                Description = SerializeLocalizedString(normalizedTour.Description),
                normalizedTour.EstimatedDurationMinutes,
                CoverImageUrl = normalizedTour.ImageUrl
            },
            tx);

        await connection.ExecuteAsync(
            "DELETE FROM tour_pois WHERE tour_id = @tourId;",
            new { tourId = normalizedTour.Id.ToString() },
            tx);

        await SaveTourStepsAsync(connection, tx, normalizedTour);
        tx.Commit();
    }

    public async Task DeleteFoodTourAsync(Guid id)
    {
        using var connection = connectionFactory.CreateConnection();

        await connection.ExecuteAsync(
            "DELETE FROM tours WHERE id = @id;",
            new { id = id.ToString() });
    }

    private static FoodTour NormalizeTour(FoodTour tour, bool assignNewCode)
    {
        var normalizedTitle = NormalizeLocalizedString(tour.Title);
        var normalizedDescription = NormalizeLocalizedString(tour.Description);
        var normalizedSteps = tour.Steps
            .OrderBy(step => step.Order)
            .Select((step, index) => new FoodTourStep
            {
                PoiId = step.PoiId,
                Order = index + 1
            })
            .ToList();

        var displayName = normalizedTitle.Vi;
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = normalizedTitle.En;
        }

        if (string.IsNullOrWhiteSpace(tour.Code) || assignNewCode)
        {
            tour.Code = BuildTourCode(displayName, tour.Category, tour.Id);
        }

        tour.Title = normalizedTitle;
        tour.Description = normalizedDescription;
        tour.Category = NormalizeNullable(tour.Category);
        tour.Steps = normalizedSteps;
        tour.EstimatedDurationMinutes = Math.Max(15, normalizedSteps.Count * 20);

        return tour;
    }

    private static async Task SaveTourStepsAsync(IDbConnection connection, IDbTransaction tx, FoodTour tour)
    {
        if (tour.Steps.Count == 0)
        {
            return;
        }

        var rows = tour.Steps.Select(step => new
        {
            TourId = tour.Id.ToString(),
            PoiId = step.PoiId.ToString(),
            SortOrder = step.Order,
            StopMinutes = 20
        });

        await connection.ExecuteAsync(
            """
            INSERT INTO tour_pois (
                tour_id,
                poi_id,
                sort_order,
                stop_minutes
            )
            VALUES (
                @TourId,
                @PoiId,
                @SortOrder,
                @StopMinutes
            );
            """,
            rows,
            tx);
    }

    private static FoodTour MapTour(TourRow row, IReadOnlyCollection<TourStepRow> stepRows)
    {
        return new FoodTour
        {
            Id = row.Id,
            Code = row.Code,
            Title = DeserializeLocalizedString(row.Name),
            Description = DeserializeLocalizedString(row.Description),
            Category = NormalizeNullable(row.Category),
            ImageUrl = NormalizeNullable(row.CoverImageUrl),
            EstimatedDurationMinutes = row.EstimatedDurationMinutes,
            Steps = stepRows
                .Where(step => step.TourId == row.Id)
                .OrderBy(step => step.SortOrder)
                .Select(step => new FoodTourStep
                {
                    PoiId = step.PoiId,
                    Order = step.SortOrder
                })
                .ToList()
        };
    }

    private static string SerializeLocalizedString(LocalizedString value) =>
        JsonSerializer.Serialize(NormalizeLocalizedString(value));

    private static LocalizedString DeserializeLocalizedString(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return new LocalizedString();
        }

        var trimmedValue = rawValue.Trim();
        if (trimmedValue.StartsWith("{"))
        {
            try
            {
                return NormalizeLocalizedString(
                    JsonSerializer.Deserialize<LocalizedString>(trimmedValue) ?? new LocalizedString());
            }
            catch
            {
                return new LocalizedString
                {
                    Vi = trimmedValue,
                    En = trimmedValue
                };
            }
        }

        return new LocalizedString
        {
            Vi = trimmedValue,
            En = trimmedValue
        };
    }

    private static LocalizedString NormalizeLocalizedString(LocalizedString? value)
    {
        var vi = NormalizeNullable(value?.Vi) ?? NormalizeNullable(value?.En) ?? string.Empty;
        var en = NormalizeNullable(value?.En) ?? NormalizeNullable(value?.Vi) ?? string.Empty;

        return new LocalizedString
        {
            Vi = vi,
            En = en
        };
    }

    private static string? NormalizeNullable(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmedValue) ? null : trimmedValue;
    }

    private static string BuildTourCode(string? title, string? category, Guid id)
    {
        var basis = NormalizeNullable(category) ?? NormalizeNullable(title) ?? "tour";
        var normalized = new string(
            basis
                .ToLowerInvariant()
                .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
                .ToArray())
            .Trim('-');

        while (normalized.Contains("--", StringComparison.Ordinal))
        {
            normalized = normalized.Replace("--", "-", StringComparison.Ordinal);
        }

        if (string.IsNullOrWhiteSpace(normalized))
        {
            normalized = "tour";
        }

        return $"{normalized}-{id.ToString("N")[..8]}";
    }

    private sealed class TourRow
    {
        public Guid Id { get; set; }
        public string? Code { get; set; }
        public string? Category { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int EstimatedDurationMinutes { get; set; }
        public string? CoverImageUrl { get; set; }
    }

    private sealed class TourStepRow
    {
        public Guid TourId { get; set; }
        public Guid PoiId { get; set; }
        public int SortOrder { get; set; }
    }
}
