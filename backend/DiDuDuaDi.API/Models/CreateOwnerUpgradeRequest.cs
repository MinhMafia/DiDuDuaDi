namespace DiDuDuaDi.API.Models;

public record CreateOwnerUpgradeRequest(
    string? Username,
    string ShopName,
    string AddressLine,
    decimal? Latitude,
    decimal? Longitude,
    string? IdCardImageUrl,
    string? BusinessLicenseImageUrl,
    string? Note);
