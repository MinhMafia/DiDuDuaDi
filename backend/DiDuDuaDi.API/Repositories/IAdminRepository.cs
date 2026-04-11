using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IAdminRepository
{
    IReadOnlyList<AdminShopIntroReviewSummary> GetShopIntroReviews(string? status);
    AdminShopIntroReviewSummary? ReviewShopIntro(Guid shopId, string adminUsername, string action, string? reason);
     Task CreateFoodTourAsync(FoodTour tour);
    Task<IReadOnlyList<FoodTour>> GetFoodToursAsync();
    Task<FoodTour?> GetFoodTourByIdAsync(Guid id);
    Task UpdateFoodTourAsync(FoodTour tour);
    Task DeleteFoodTourAsync(Guid id);
}
