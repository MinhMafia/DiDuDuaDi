using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DiDuDuaDi.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace DiDuDuaDi.API.Services;

public class JwtTokenService(IConfiguration configuration) : ITokenService
{
    public AuthSession CreateSession(AuthUser user)
    {
        var jwtSection = configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer");
        var audience = jwtSection["Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience");
        var secretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("Missing Jwt:SecretKey");
        var expiresInHours = jwtSection.GetValue<int?>("ExpiresInHours") ?? 12;

        var expiresAtUtc = DateTime.UtcNow.AddHours(expiresInHours);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("display_name", user.DisplayName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new AuthSession
        {
            Username = user.Username,
            Role = user.Role,
            DisplayName = user.DisplayName,
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expiresAtUtc
        };
    }
}
