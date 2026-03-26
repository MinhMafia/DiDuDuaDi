namespace DiDuDuaDi.API.Models;

public record CreateClaimCodeRequest(decimal Amount, string? Note, int ExpireAfterHours = 24);
