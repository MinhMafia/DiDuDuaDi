using System.Text.Json.Serialization;

namespace DiDuDuaDi.API.Models;

public class TopShopSummary
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    [JsonPropertyName("lat")]
    public double Latitude { get; set; }
    [JsonPropertyName("lng")]
    public double Longitude { get; set; }
    public int Count { get; set; }
    public string Metric { get; set; } = string.Empty;
}


