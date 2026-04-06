namespace DiDuDuaDi.API.Models;

public record UpdateShopProfileRequest(
    string ShopName,
    string? Description,
    string? PendingIntroduction,
    string AddressLine,
    decimal? Latitude,
    decimal? Longitude,
    string? OpeningHours,
    string? Phone,
    string? ImageUrl);
