using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class InMemoryPoiRepository : IPoiRepository
{
    private readonly List<POI> _pois =
    [
        new()
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Quan Bun Bo Di Sau",
            Category = "food",
            Description = "Quan bun bo noi tieng tai pho am thuc Vinh Khanh",
            Location = new GeoPoint(10.7620, 106.7030)
        },
        new()
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Banh Mi Vinh Khanh",
            Category = "food",
            Description = "Banh mi nong gion, phuc vu buoi toi",
            Location = new GeoPoint(10.7625, 106.7035)
        },
        new()
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "Che 3 Mien",
            Category = "dessert",
            Description = "Quan che truyen thong voi nhieu topping",
            Location = new GeoPoint(10.7615, 106.7025)
        }
    ];

    public IReadOnlyList<POI> GetAll() => _pois;

    public IReadOnlyList<POI> GetNearby(double lat, double lng, double radiusMeters)
    {
        return _pois
            .Select(p => new { Poi = p, Distance = HaversineMeters(lat, lng, p.Location.Lat, p.Location.Lng) })
            .Where(x => x.Distance <= radiusMeters)
            .OrderBy(x => x.Distance)
            .Select(x => x.Poi)
            .ToList();
    }

    private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180);
}
