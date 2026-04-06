namespace DiDuDuaDi.API.Models;

public class OwnerUpgradeRequestSummary
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string? IdCardImageUrl { get; set; }
    public string? BusinessLicenseImageUrl { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ReviewNote { get; set; }
}
