using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController(IAdminRepository adminRepository) : ControllerBase
{
    [HttpGet("shop-intros")]
    public ActionResult<ApiResponse<IReadOnlyList<AdminShopIntroReviewSummary>>> GetShopIntros([FromQuery] string? status)
    {
        var data = adminRepository.GetShopIntroReviews(status);
        return Ok(new ApiResponse<IReadOnlyList<AdminShopIntroReviewSummary>>(data));
    }

    [HttpPost("shop-intros/{shopId:guid}/review")]
    public ActionResult<ApiResponse<AdminShopIntroReviewSummary>> ReviewShopIntro(Guid shopId, [FromBody] ReviewShopIntroRequest request)
    {
        var adminUsername = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(adminUsername))
        {
            return BadRequest(new ApiResponse<AdminShopIntroReviewSummary>(null!, false, "Admin username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.Action))
        {
            return BadRequest(new ApiResponse<AdminShopIntroReviewSummary>(null!, false, "Action is required"));
        }

        var reviewed = adminRepository.ReviewShopIntro(shopId, adminUsername, request.Action, request.Reason);
        if (reviewed is null)
        {
            return NotFound(new ApiResponse<AdminShopIntroReviewSummary>(null!, false, "Shop intro not found or review action invalid"));
        }

        return Ok(new ApiResponse<AdminShopIntroReviewSummary>(reviewed, true, "Shop intro reviewed successfully"));
    }
/* Commented FoodTour endpoints */

}
