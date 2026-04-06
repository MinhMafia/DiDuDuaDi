using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "owner")]
public class OwnerController(IOwnerRepository ownerRepository) : ControllerBase
{
    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<OwnerShopDashboard>> GetDashboard()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
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
    public ActionResult<ApiResponse<OwnerShopDashboard>> UpdateShopProfile([FromBody] UpdateShopProfileRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.ShopName) || string.IsNullOrWhiteSpace(request.AddressLine))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Shop name and address are required"));
        }

        if (request.Latitude.HasValue && (request.Latitude < -90 || request.Latitude > 90))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Latitude must be between -90 and 90"));
        }

        if (request.Longitude.HasValue && (request.Longitude < -180 || request.Longitude > 180))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Longitude must be between -180 and 180"));
        }

        var dashboard = ownerRepository.UpdateShopProfile(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner shop not found"));
        }

        return Ok(new ApiResponse<OwnerShopDashboard>(dashboard, true, "Shop profile updated"));
    }

    [HttpPut("poi-content")]
    public ActionResult<ApiResponse<OwnerShopDashboard>> UpdatePoiContent([FromBody] UpdateOwnerPoiContentRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.NameVi)
            || string.IsNullOrWhiteSpace(request.DescriptionVi)
            || string.IsNullOrWhiteSpace(request.NameEn)
            || string.IsNullOrWhiteSpace(request.DescriptionEn))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "POI name and description are required in both VI and EN"));
        }

        var dashboard = ownerRepository.UpdatePoiContent(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner POI not found"));
        }

        return Ok(new ApiResponse<OwnerShopDashboard>(dashboard, true, "POI content updated"));
    }

    [HttpPost("menu-items")]
    public ActionResult<ApiResponse<MenuItemSummary>> CreateMenuItem([FromBody] UpsertMenuItemRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
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
        long menuItemId,
        [FromBody] UpsertMenuItemRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
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
    public ActionResult<ApiResponse<bool>> DeleteMenuItem(long menuItemId)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
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
    public ActionResult<ApiResponse<ClaimCodeSummary>> CreateClaimCode([FromBody] CreateClaimCodeRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
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
