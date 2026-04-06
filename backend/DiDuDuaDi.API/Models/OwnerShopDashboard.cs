namespace DiDuDuaDi.API.Models;

public class OwnerShopDashboard
{
    public Guid ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? Description { get; set; }
    public string? ApprovedIntroduction { get; set; }
    public string? PendingIntroduction { get; set; }
    public string IntroReviewStatus { get; set; } = "approved";
    public string? OpeningHours { get; set; }
    public string? Phone { get; set; }
    public string? ImageUrl { get; set; }
    public OwnerPoiContentSummary? PrimaryPoi { get; set; }
    public List<MenuItemSummary> MenuItems { get; set; } = [];
    public List<ClaimCodeSummary> RecentClaimCodes { get; set; } = [];
    public ShopStatsSummary Stats { get; set; } = new();
}
