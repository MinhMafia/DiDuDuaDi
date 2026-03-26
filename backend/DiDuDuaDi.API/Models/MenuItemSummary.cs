namespace DiDuDuaDi.API.Models;

public record MenuItemSummary(
    long Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    bool IsAvailable,
    int DisplayOrder);
