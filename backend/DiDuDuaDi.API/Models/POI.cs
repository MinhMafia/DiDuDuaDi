namespace DiDuDuaDi.API.Models;

public class POI
{
    public Guid Id { get; set; }
    public Dictionary<string, string> Name { get; set; } = [];
    public string Category { get; set; } = "food";
    public GeoPoint Location { get; set; } = new(0, 0);
    public Dictionary<string, string> Description { get; set; } = [];
    public Guid? ShopId { get; set; }
    public string? ShopName { get; set; }
    public string? ShopAddress { get; set; }
    public string? ApprovedIntroduction { get; set; }
    public List<MenuItemSummary> MenuItems { get; set; } = [];
}
