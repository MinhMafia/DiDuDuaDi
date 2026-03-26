namespace DiDuDuaDi.API.Models;

public record ClaimCodeSummary(
    long Id,
    string Code,
    decimal Amount,
    string Status,
    string? Note,
    DateTime IssuedAt,
    DateTime? ExpiresAt);
