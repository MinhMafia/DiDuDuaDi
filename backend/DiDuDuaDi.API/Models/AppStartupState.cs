namespace DiDuDuaDi.API.Models;

public class AppStartupState
{
    public DateTimeOffset StartedAtUtc { get; } = DateTimeOffset.UtcNow;

    public bool DatabaseReady { get; set; } = true;

    public string? DatabaseInitializationError { get; set; }
}
