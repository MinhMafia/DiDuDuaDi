using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Services;

public interface ITokenService
{
    AuthSession CreateSession(AuthUser user);
}
