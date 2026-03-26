using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IAuthRepository
{
    AuthUser? ValidateCredentials(string username, string password);
}
