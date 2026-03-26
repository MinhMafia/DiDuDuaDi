using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class MySqlPoiRepository(IDbConnectionFactory connectionFactory) : IPoiRepository
{
    public IReadOnlyList<POI> GetAll()
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = connection.Query<PoiTranslationRow>(GetBaseQuery());
        return MapPois(rows, GetMenuItemsByShop(connection));
    }

    public IReadOnlyList<POI> GetNearby(double lat, double lng, double radiusMeters)
    {
        var pois = GetAll();

        return pois
            .Where(poi => DistanceMeters(lat, lng, poi.Location.Lat, poi.Location.Lng) <= radiusMeters)
            .ToList();
    }

    private static string GetBaseQuery() =>
        """
        SELECT
            p.id AS PoiId,
            p.shop_id AS ShopId,
            p.category AS Category,
            p.latitude AS Latitude,
            p.longitude AS Longitude,
            s.name AS ShopName,
            s.address_line AS ShopAddress,
            COALESCE(s.approved_intro, s.description) AS ApprovedIntroduction,
            pt.language_code AS LanguageCode,
            pt.name AS Name,
            pt.description AS Description
        FROM pois p
        LEFT JOIN shops s ON s.id = p.shop_id
        LEFT JOIN poi_translations pt ON pt.poi_id = p.id
        WHERE p.is_active = 1
        ORDER BY p.created_at ASC, pt.language_code ASC;
        """;

    private static IReadOnlyList<POI> MapPois(
        IEnumerable<PoiTranslationRow> rows,
        IReadOnlyDictionary<Guid, List<MenuItemSummary>> menuItemsByShop)
    {
        var pois = new Dictionary<Guid, POI>();

        foreach (var row in rows)
        {
            if (!pois.TryGetValue(row.PoiId, out var poi))
            {
                poi = new POI
                {
                    Id = row.PoiId,
                    ShopId = row.ShopId,
                    ShopName = row.ShopName,
                    ShopAddress = row.ShopAddress,
                    ApprovedIntroduction = row.ApprovedIntroduction,
                    Category = row.Category,
                    Location = new GeoPoint((double)row.Latitude, (double)row.Longitude)
                };

                if (row.ShopId.HasValue && menuItemsByShop.TryGetValue(row.ShopId.Value, out var menuItems))
                {
                    poi.MenuItems = menuItems;
                }

                pois[row.PoiId] = poi;
            }

            if (!string.IsNullOrWhiteSpace(row.LanguageCode))
            {
                poi.Name[row.LanguageCode] = row.Name ?? string.Empty;
                poi.Description[row.LanguageCode] = row.Description ?? string.Empty;
            }
        }

        return pois.Values.ToList();
    }

    private static IReadOnlyDictionary<Guid, List<MenuItemSummary>> GetMenuItemsByShop(System.Data.IDbConnection connection)
    {
        var rows = connection.Query<MenuItemRow>(
            """
            SELECT
                shop_id AS ShopId,
                id AS Id,
                name AS Name,
                description AS Description,
                price AS Price,
                image_url AS ImageUrl,
                is_available AS IsAvailable,
                display_order AS DisplayOrder
            FROM menu_items
            WHERE is_available = 1
            ORDER BY shop_id ASC, display_order ASC, id ASC;
            """);

        return rows
            .GroupBy(row => row.ShopId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(row => new MenuItemSummary(
                        row.Id,
                        row.Name,
                        row.Description,
                        row.Price,
                        row.ImageUrl,
                        row.IsAvailable,
                        row.DisplayOrder))
                    .ToList());
    }

    private static double DistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double earthRadius = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLng = DegreesToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadius * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;

    private sealed class PoiTranslationRow
    {
        public Guid PoiId { get; init; }
        public Guid? ShopId { get; init; }
        public string Category { get; init; } = "food";
        public decimal Latitude { get; init; }
        public decimal Longitude { get; init; }
        public string? ShopName { get; init; }
        public string? ShopAddress { get; init; }
        public string? ApprovedIntroduction { get; init; }
        public string? LanguageCode { get; init; }
        public string? Name { get; init; }
        public string? Description { get; init; }
    }

    private sealed class MenuItemRow
    {
        public Guid ShopId { get; init; }
        public long Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string? Description { get; init; }
        public decimal Price { get; init; }
        public string? ImageUrl { get; init; }
        public bool IsAvailable { get; init; }
        public int DisplayOrder { get; init; }
    }
}
