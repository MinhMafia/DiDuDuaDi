using System.Data;

namespace DiDuDuaDi.API.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
