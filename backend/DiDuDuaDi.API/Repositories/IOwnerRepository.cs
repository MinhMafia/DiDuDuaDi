using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public interface IOwnerRepository
{
    OwnerShopDashboard? GetDashboard(string username);
    OwnerShopDashboard? UpdateShopProfile(string username, UpdateShopProfileRequest request);
    MenuItemSummary? CreateMenuItem(string username, UpsertMenuItemRequest request);
    MenuItemSummary? UpdateMenuItem(string username, long menuItemId, UpsertMenuItemRequest request);
    bool DeleteMenuItem(string username, long menuItemId);
    ClaimCodeSummary? CreateClaimCode(string username, CreateClaimCodeRequest request);
}
