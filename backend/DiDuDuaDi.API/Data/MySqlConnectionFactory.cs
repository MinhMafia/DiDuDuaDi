using System.Data;
using MySqlConnector;

namespace DiDuDuaDi.API.Data;

public class MySqlConnectionFactory(IConfiguration configuration) : IDbConnectionFactory
{
    private readonly string _connectionString =
        configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

    public IDbConnection CreateConnection() => new MySqlConnection(_connectionString);
}
