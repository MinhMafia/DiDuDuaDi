using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IPoiRepository
{
    IReadOnlyList<POI> GetAll();
    IReadOnlyList<POI> GetNearby(double lat, double lng, double radiusMeters);
}
