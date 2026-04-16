using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IUserRepository
{
    Task<Guid?> GetAccountIdByUsernameAsync(string username);
    Task AddFavoritePoiAsync(Guid accountId, Guid poiId);
    Task RemoveFavoritePoiAsync(Guid accountId, Guid poiId);
    Task<IReadOnlyList<POI>> GetFavoritePoisAsync(Guid accountId);
    Task<bool> IsFavoritePoiAsync(Guid accountId, Guid poiId);
}