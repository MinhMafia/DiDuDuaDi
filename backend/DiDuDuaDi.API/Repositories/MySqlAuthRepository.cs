using Dapper;
using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class MySqlAuthRepository(IDbConnectionFactory connectionFactory) : IAuthRepository
{
    public AuthUser? ValidateCredentials(string username, string password)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
            SELECT
                a.username AS Username,
                r.code AS Role,
                a.display_name AS DisplayName,
                a.password_hash AS PasswordHash
            FROM accounts a
            INNER JOIN roles r ON r.id = a.role_id
            WHERE a.username = @username
              AND a.is_active = 1
            LIMIT 1;
            """;

        var row = connection.QuerySingleOrDefault<AuthRow>(sql, new { username });
        if (row is null || !PasswordMatches(row.PasswordHash, password))
        {
            return null;
        }

        connection.Execute(
            "UPDATE accounts SET last_login_at = CURRENT_TIMESTAMP WHERE username = @username;",
            new { username });

        return new AuthUser(row.Username, row.Role, row.DisplayName);
    }

    private static bool PasswordMatches(string passwordHash, string password)
    {
        // For this seminar build we allow plain-text demo passwords in the seed file.
        // Replace this with BCrypt/Argon2 verification before going to production.
        return string.Equals(passwordHash, password, StringComparison.Ordinal);
    }

    private sealed record AuthRow(string Username, string Role, string DisplayName, string PasswordHash);
}
