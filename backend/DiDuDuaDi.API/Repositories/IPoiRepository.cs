using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IPoiRepository
{
    IReadOnlyList<POI> GetAll(Guid? accountId = null);
    IReadOnlyList<POI> GetNearby(double lat, double lng, double radiusMeters, Guid? accountId = null);
    POI? GetById(Guid id, Guid? accountId = null);
    POI Add(POI poi);
    POI Update(POI poi);
    bool Delete(Guid id);
}
