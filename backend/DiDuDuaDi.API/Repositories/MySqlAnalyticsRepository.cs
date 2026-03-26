using Dapper;
using DiDuDuaDi.API.Data;

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

    private sealed class PoiShopRow
    {
        public Guid PoiId { get; init; }
        public Guid? ShopId { get; init; }
    }
}
