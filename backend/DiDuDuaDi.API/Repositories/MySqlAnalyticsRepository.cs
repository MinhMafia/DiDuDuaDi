using Dapper;
using System.Linq;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;


namespace DiDuDuaDi.API.Repositories;

public class MySqlAnalyticsRepository(IDbConnectionFactory connectionFactory) : IAnalyticsRepository
{
    public bool TrackPoiView(Guid poiId, string? languageCode, string? source)
    {
        using var connection = connectionFactory.CreateConnection();

        var row = connection.QuerySingleOrDefault<PoiShopRow>(
            """
            SELECT id AS PoiId, shop_id AS ShopId
            FROM pois
            WHERE id = @poiId
              AND shop_id IS NOT NULL
            LIMIT 1;
            """,
            new { poiId });

        if (row is null || row.ShopId is null)
        {
            return false;
        }

        connection.Execute(
            """
            INSERT INTO shop_visit_events (shop_id, poi_id, language_code, source)
            VALUES (@ShopId, @PoiId, @LanguageCode, @Source);
            """,
            new
            {
                row.ShopId,
                row.PoiId,
                LanguageCode = string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode,
                Source = string.IsNullOrWhiteSpace(source) ? "map" : source
            });

        return true;
    }

    public bool TrackAudioPlay(Guid poiId, string? languageCode, string? source)
    {
        using var connection = connectionFactory.CreateConnection();

        var row = connection.QuerySingleOrDefault<PoiShopRow>(
            """
            SELECT id AS PoiId, shop_id AS ShopId
            FROM pois
            WHERE id = @poiId
              AND shop_id IS NOT NULL
            LIMIT 1;
            """,
            new { poiId });

        if (row is null || row.ShopId is null)
        {
            return false;
        }

        connection.Execute(
            """
            INSERT INTO audio_play_events (shop_id, poi_id, language_code, source)
            VALUES (@ShopId, @PoiId, @LanguageCode, @Source);
            """,
            new
            {
                row.ShopId,
                row.PoiId,
                LanguageCode = string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode,
                Source = string.IsNullOrWhiteSpace(source) ? "tts" : source
            });

        return true;
    }

    public int GetActiveVisitorsCount(int minutes = 5)
    {
        using var connection = connectionFactory.CreateConnection();

        const string query = """
            SELECT COUNT(*)
            FROM (
                SELECT created_at
                FROM shop_visit_events
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL @Minutes MINUTE)

                UNION ALL

                SELECT created_at
                FROM audio_play_events
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL @Minutes MINUTE)
            ) AS recent_activity;
            """;

        return connection.QuerySingle<int>(query, new { Minutes = minutes });
    }

    private sealed class PoiShopRow
    {
        public Guid PoiId { get; init; }
        public Guid? ShopId { get; init; }
    }

    public IReadOnlyList<TopShopSummary> GetTopShops(int days = 30, int limit = 10, string metric = "visits")
    {
        using var connection = connectionFactory.CreateConnection();

        var tableName = metric.ToLower() switch
        {
            "audio" => "audio_play_events",
            _ => "shop_visit_events"
        };
        var metricName = metric.ToLower() switch
        {
            "audio" => "Audio Plays",
            _ => "Visits"
        };

        const string query = """
            SELECT 
                s.name AS Name,
                s.slug AS Slug,
                s.latitude AS Latitude,
                s.longitude AS Longitude,
                COUNT(*) AS Count
            FROM {0} e
            JOIN shops s ON e.shop_id = s.id
            WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL @Days DAY)
            GROUP BY e.shop_id
            ORDER BY Count DESC
            LIMIT @Limit
            """;

        var formattedQuery = string.Format(query, tableName);

        var results = connection.Query<TopShopSummary>(formattedQuery, new { Days = days, Limit = limit })
            .ToList();
        foreach (var r in results) {
            r.Metric = metricName;
        }
        return results.AsReadOnly();
    }

    public IReadOnlyList<TopPoiSummary> GetTopPois(int days = 30, int limit = 10, string metric = "visits")
    {
        using var connection = connectionFactory.CreateConnection();

        var tableName = metric.ToLower() switch
        {
            "audio" => "audio_play_events",
            _ => "shop_visit_events"
        };
        var metricName = metric.ToLower() switch
        {
            "audio" => "Audio Plays",
            _ => "Visits"
        };

        const string query = """
            SELECT 
                COALESCE(pt.name, 'Unnamed POI') AS Name,
                p.id AS Id,
                p.latitude AS Latitude,
                p.longitude AS Longitude,
                COUNT(*) AS Count
            FROM {0} e
            JOIN pois p ON e.poi_id = p.id
            LEFT JOIN poi_translations pt ON pt.poi_id = p.id AND pt.language_code = 'vi'
            WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL @Days DAY)
            GROUP BY p.id
            ORDER BY Count DESC
            LIMIT @Limit
            """;

        var formattedQuery = string.Format(query, tableName);

        var results = connection.Query<TopPoiSummary>(formattedQuery, new { Days = days, Limit = limit })
            .ToList();
        foreach (var r in results) {
            r.Metric = metricName;
        }
        return results.AsReadOnly();
    }
}

