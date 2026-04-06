namespace DiDuDuaDi.API.Models;

public class OwnerPoiContentSummary
{
    public Guid PoiId { get; set; }
    public string Category { get; set; } = "food";
    public string NameVi { get; set; } = string.Empty;
    public string DescriptionVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
}
