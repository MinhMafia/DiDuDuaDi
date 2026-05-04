using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IOwnerRepository
{
    OwnerShopDashboard? GetDashboard(string username);
    OwnerShopDashboard? UpdateShopProfile(string username, UpdateShopProfileRequest request);
    Task<OwnerShopDashboard?> UpdatePoiContentAsync(string username, UpdateOwnerPoiContentRequest request);
    MenuItemSummary? CreateMenuItem(string username, UpsertMenuItemRequest request);
    MenuItemSummary? UpdateMenuItem(string username, long menuItemId, UpsertMenuItemRequest request);
    bool DeleteMenuItem(string username, long menuItemId);
    void UpsertPoiTranslation(Guid poiId, string languageCode, string name, string description, string? audioUrl);
}
