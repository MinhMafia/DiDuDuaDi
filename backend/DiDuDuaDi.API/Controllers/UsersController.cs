using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(IUserRepository userRepository) : ControllerBase
{
    [HttpGet("me/favorites")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<POI>>>> GetFavorites()
    {
        var accountId = await GetCurrentAccountIdAsync();
        if (accountId == null) return Unauthorized(new ApiResponse<IReadOnlyList<POI>>([], false, "Unauthorized"));

        var data = await userRepository.GetFavoritePoisAsync(accountId.Value);
        return Ok(new ApiResponse<IReadOnlyList<POI>>(data));
    }

    [HttpPost("me/favorites/{poiId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> AddFavorite(Guid poiId)
    {
        var accountId = await GetCurrentAccountIdAsync();
        if (accountId == null) return Unauthorized(new ApiResponse<bool>(false, false, "Unauthorized"));

        await userRepository.AddFavoritePoiAsync(accountId.Value, poiId);
        return Ok(new ApiResponse<bool>(true, true, "Added to favorites"));
    }

    [HttpDelete("me/favorites/{poiId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveFavorite(Guid poiId)
    {
        var accountId = await GetCurrentAccountIdAsync();
        if (accountId == null) return Unauthorized(new ApiResponse<bool>(false, false, "Unauthorized"));

        await userRepository.RemoveFavoritePoiAsync(accountId.Value, poiId);
        return Ok(new ApiResponse<bool>(true, true, "Removed from favorites"));
    }

    private async Task<Guid?> GetCurrentAccountIdAsync()
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return null;

        if (Guid.TryParse(claimValue, out var accountId)) return accountId;

        return await userRepository.GetAccountIdByUsernameAsync(claimValue);
    }
}