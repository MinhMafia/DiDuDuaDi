using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "owner")]
public class OwnerController(IOwnerRepository ownerRepository, ITranslationService translationService, ITextToSpeechService textToSpeechService) : ControllerBase
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
    public async Task<ActionResult<ApiResponse<OwnerShopDashboard>>> UpdatePoiContent([FromBody] UpdateOwnerPoiContentRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        if (string.IsNullOrWhiteSpace(request.NameVi)
            || string.IsNullOrWhiteSpace(request.DescriptionVi))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "POI name and description are required in VI"));
        }

        var dashboard = await ownerRepository.UpdatePoiContentAsync(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner POI not found"));
        }

        var poiId = dashboard.PrimaryPoi?.PoiId; 

        if (poiId != null) // Đảm bảo POI tồn tại
        {
            string? audioUrlVi = await textToSpeechService.GenerateAndSaveAudioAsync(request.DescriptionVi, "vi", poiId.Value.ToString());
            
            ownerRepository.UpsertPoiTranslation(
                poiId.Value,
                "vi", 
                request.NameVi, 
                request.DescriptionVi,
                audioUrlVi
            );
            await Task.Delay(1000);

            string[] targetLanguages = new[] { "en", "zh", "ja", "ko", "fr", "th" };

            foreach (var lang in targetLanguages)
            {
                // Gọi API dịch thuật (Hàm này vẫn cần await vì nó gọi ra ngoài internet)
                var (translatedName, translatedDesc) = await translationService.TranslatePoiContentAsync(request.NameVi, request.DescriptionVi, lang);

                string? audioUrl = await textToSpeechService.GenerateAndSaveAudioAsync(translatedDesc, lang, poiId.Value.ToString());

                ownerRepository.UpsertPoiTranslation(
                    poiId.Value,
                    lang, 
                    translatedName, 
                    translatedDesc,
                    audioUrl
                );
            }
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