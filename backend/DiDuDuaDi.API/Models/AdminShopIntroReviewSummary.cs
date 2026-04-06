namespace DiDuDuaDi.API.Models;

public class AdminShopIntroReviewSummary
{
    public Guid ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string OwnerUsername { get; set; } = string.Empty;
    public string OwnerDisplayName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string? ApprovedIntroduction { get; set; }
    public string? PendingIntroduction { get; set; }
    public string IntroReviewStatus { get; set; } = "approved";
    public string? ReviewNote { get; set; }
}
