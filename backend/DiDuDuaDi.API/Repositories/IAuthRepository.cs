using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IAuthRepository
{
    AuthUser? ValidateCredentials(string username, string password);
    AuthUser? Register(RegisterRequest request);
    OwnerUpgradeRequestSummary? CreateOwnerUpgradeRequest(CreateOwnerUpgradeRequest request);
    string? GetRoleCodeByUsername(string username);
    bool HasPendingOwnerUpgradeRequest(string username);
    OwnerUpgradeRequestSummary? GetLatestOwnerUpgradeRequest(string username);
    IReadOnlyList<OwnerUpgradeRequestSummary> GetOwnerUpgradeRequestHistory(string username);
    IReadOnlyList<OwnerUpgradeRequestSummary> GetOwnerUpgradeRequests(string? status);
    OwnerUpgradeRequestSummary? UpdateMyPendingOwnerUpgradeRequest(long requestId, string username, CreateOwnerUpgradeRequest request);
    OwnerUpgradeRequestSummary? CancelMyPendingOwnerUpgradeRequest(long requestId, string username);
    OwnerUpgradeRequestSummary? ApproveOwnerUpgradeRequest(long requestId, string adminUsername);
    OwnerUpgradeRequestSummary? ReviewOwnerUpgradeRequest(long requestId, string adminUsername, string action, string? reason);
    OwnerUpgradeRequestSummary? CancelOwnerUpgradePayment(long requestId, string adminUsername);
    OwnerUpgradeRequestSummary? ConfirmOwnerUpgradePayment(long requestId, string adminUsername);
}
