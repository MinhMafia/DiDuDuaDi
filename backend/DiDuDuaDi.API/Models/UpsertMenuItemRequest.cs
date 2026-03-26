namespace DiDuDuaDi.API.Models;

public record UpsertMenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    bool IsAvailable,
    int DisplayOrder);
