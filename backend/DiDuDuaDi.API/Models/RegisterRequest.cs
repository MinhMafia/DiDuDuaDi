namespace DiDuDuaDi.API.Models;

public record RegisterRequest(
    string Username,
    string Password,
    string DisplayName,
    string? Email);
