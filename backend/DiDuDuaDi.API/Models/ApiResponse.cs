namespace DiDuDuaDi.API.Models;

public record ApiResponse<T>(T Data, bool Success = true, string? Message = null);
