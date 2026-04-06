namespace DiDuDuaDi.API.Models;

public record CreateOwnerUpgradeRequest(
    string Username,
    string ShopName,
    string AddressLine,
    string? IdCardImageUrl,
    string? BusinessLicenseImageUrl,
    string? Note);
