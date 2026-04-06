using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IAuthRepository
{
    AuthUser? ValidateCredentials(string username, string password);
    AuthUser? Register(RegisterRequest request);
    OwnerUpgradeRequestSummary? CreateOwnerUpgradeRequest(CreateOwnerUpgradeRequest request);
    string? GetRoleCodeByUsername(string username);
    bool HasPendingOwnerUpgradeRequest(string username);
    IReadOnlyList<OwnerUpgradeRequestSummary> GetOwnerUpgradeRequests(string? status);
    OwnerUpgradeRequestSummary? ApproveOwnerUpgradeRequest(long requestId, string adminUsername);
    OwnerUpgradeRequestSummary? ReviewOwnerUpgradeRequest(long requestId, string adminUsername, string action, string? reason);
}
