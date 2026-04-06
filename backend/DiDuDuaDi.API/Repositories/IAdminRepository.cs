using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IAdminRepository
{
    IReadOnlyList<AdminShopIntroReviewSummary> GetShopIntroReviews(string? status);
    AdminShopIntroReviewSummary? ReviewShopIntro(Guid shopId, string adminUsername, string action, string? reason);
}
