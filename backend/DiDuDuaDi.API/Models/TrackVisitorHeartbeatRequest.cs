namespace DiDuDuaDi.API.Models;

public class TrackVisitorHeartbeatRequest
{
    public string SessionKey { get; set; } = string.Empty;
    public string Source { get; set; } = "map";
    public string Page { get; set; } = "map";
}
