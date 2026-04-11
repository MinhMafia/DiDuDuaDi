using System.Text.Json.Serialization;

namespace DiDuDuaDi.API.Models;

public class TopPoiSummary
{
    public string Name { get; set; } = string.Empty;
    public Guid Id { get; set; }
    [JsonPropertyName("lat")]
    public double Latitude { get; set; }
    [JsonPropertyName("lng")]
    public double Longitude { get; set; }
    public int Count { get; set; }
    public string Metric { get; set; } = string.Empty;
}


