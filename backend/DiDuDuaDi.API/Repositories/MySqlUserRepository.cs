using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class MySqlUserRepository(IDbConnectionFactory connectionFactory, IPoiRepository poiRepository) : IUserRepository
{
    public async Task AddFavoritePoiAsync(Guid accountId, Guid poiId)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = """
            INSERT IGNORE INTO user_favorites (account_id, poi_id, created_at)
            VALUES (@AccountId, @PoiId, CURRENT_TIMESTAMP);
            """;
        await connection.ExecuteAsync(sql, new { AccountId = accountId, PoiId = poiId });
    }

    public async Task RemoveFavoritePoiAsync(Guid accountId, Guid poiId)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = "DELETE FROM user_favorites WHERE account_id = @AccountId AND poi_id = @PoiId;";
        await connection.ExecuteAsync(sql, new { AccountId = accountId, PoiId = poiId });
    }

    public async Task<IReadOnlyList<POI>> GetFavoritePoisAsync(Guid accountId)
    {
        using var connection = connectionFactory.CreateConnection();
        
        // Lấy danh sách ID các POI yêu thích của user, sắp xếp mới nhất lên đầu
        var sql = "SELECT poi_id FROM user_favorites WHERE account_id = @AccountId ORDER BY created_at DESC;";
        var favoritePoiIds = (await connection.QueryAsync<Guid>(sql, new { AccountId = accountId })).ToList();

        if (!favoritePoiIds.Any()) return new List<POI>();

        // Lấy toàn bộ chi tiết POI (có sẵn IsFavorite = true do ta truyền accountId)
        var allPois = poiRepository.GetAll(accountId);

        // Ánh xạ lại đúng thứ tự yêu thích
        return favoritePoiIds
            .Select(id => allPois.FirstOrDefault(p => p.Id == id))
            .Where(p => p != null)
            .Select(p => p!)
            .ToList();
    }

    public async Task<bool> IsFavoritePoiAsync(Guid accountId, Guid poiId)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = "SELECT COUNT(*) FROM user_favorites WHERE account_id = @AccountId AND poi_id = @PoiId;";
        var count = await connection.ExecuteScalarAsync<int>(sql, new { AccountId = accountId, PoiId = poiId });
        return count > 0;
    }

    public async Task<Guid?> GetAccountIdByUsernameAsync(string username)
    {
        using var connection = connectionFactory.CreateConnection();
        var sql = "SELECT id FROM accounts WHERE username = @Username AND is_active = 1 LIMIT 1;";
        return await connection.QuerySingleOrDefaultAsync<Guid?>(sql, new { Username = username });
    }
}