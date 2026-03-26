using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OwnerController(IOwnerRepository ownerRepository) : ControllerBase
{
    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<OwnerShopDashboard>> GetDashboard([FromQuery] string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        var dashboard = ownerRepository.GetDashboard(username);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner shop not found"));
        }

        return Ok(new ApiResponse<OwnerShopDashboard>(dashboard));
    }

    [HttpPut("shop-profile")]
    public ActionResult<ApiResponse<OwnerShopDashboard>> UpdateShopProfile(
        [FromQuery] string username,
        [FromBody] UpdateShopProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.ShopName) || string.IsNullOrWhiteSpace(request.AddressLine))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Shop name and address are required"));
        }

        var dashboard = ownerRepository.UpdateShopProfile(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner shop not found"));
        }

        return Ok(new ApiResponse<OwnerShopDashboard>(dashboard, true, "Shop profile updated"));
    }

    [HttpPost("menu-items")]
    public ActionResult<ApiResponse<MenuItemSummary>> CreateMenuItem(
        [FromQuery] string username,
        [FromBody] UpsertMenuItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.Name) || request.Price < 0)
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, "Invalid menu item data"));
        }

        var item = ownerRepository.CreateMenuItem(username, request);
        if (item is null)
        {
            return NotFound(new ApiResponse<MenuItemSummary>(null!, false, "Owner shop not found"));
        }

        return Ok(new ApiResponse<MenuItemSummary>(item, true, "Menu item created"));
    }

    [HttpPut("menu-items/{menuItemId:long}")]
    public ActionResult<ApiResponse<MenuItemSummary>> UpdateMenuItem(
        [FromQuery] string username,
        long menuItemId,
        [FromBody] UpsertMenuItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.Name) || request.Price < 0)
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, "Invalid menu item data"));
        }

        var item = ownerRepository.UpdateMenuItem(username, menuItemId, request);
        if (item is null)
        {
            return NotFound(new ApiResponse<MenuItemSummary>(null!, false, "Menu item not found"));
        }

        return Ok(new ApiResponse<MenuItemSummary>(item, true, "Menu item updated"));
    }

    [HttpDelete("menu-items/{menuItemId:long}")]
    public ActionResult<ApiResponse<bool>> DeleteMenuItem([FromQuery] string username, long menuItemId)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<bool>(false, false, "Username is required"));
        }

        var deleted = ownerRepository.DeleteMenuItem(username, menuItemId);
        if (!deleted)
        {
            return NotFound(new ApiResponse<bool>(false, false, "Menu item not found"));
        }

        return Ok(new ApiResponse<bool>(true, true, "Menu item deleted"));
    }

    [HttpPost("claim-codes")]
    public ActionResult<ApiResponse<ClaimCodeSummary>> CreateClaimCode(
        [FromQuery] string username,
        [FromBody] CreateClaimCodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<ClaimCodeSummary>(null!, false, "Username is required"));
        }

        if (request.Amount < 0)
        {
            return BadRequest(new ApiResponse<ClaimCodeSummary>(null!, false, "Amount must be positive"));
        }

        var claimCode = ownerRepository.CreateClaimCode(username, request);
        if (claimCode is null)
        {
            return NotFound(new ApiResponse<ClaimCodeSummary>(null!, false, "Owner shop not found"));
        }

        return Ok(new ApiResponse<ClaimCodeSummary>(claimCode, true, "Claim code created"));
    }
}
