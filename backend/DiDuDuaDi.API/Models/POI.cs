namespace DiDuDuaDi.API.Models;

public class POI
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "food";
    public GeoPoint Location { get; set; } = new(0, 0);
    public string Description { get; set; } = string.Empty;
}
