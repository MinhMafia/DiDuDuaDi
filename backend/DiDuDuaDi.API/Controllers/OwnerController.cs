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
    private const int MaxMenuImageUrlLength = 500;

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

    [HttpPatch("shop-open-status")]
    public ActionResult<ApiResponse<OwnerShopDashboard>> UpdateShopOpenStatus([FromBody] UpdateShopOpenStatusRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        var dashboard = ownerRepository.UpdateShopOpenStatus(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner shop not found"));
        }

        var message = request.IsTemporarilyClosed
            ? "Shop marked as temporarily closed"
            : "Shop marked as open";

        return Ok(new ApiResponse<OwnerShopDashboard>(dashboard, true, message));
    }

    [HttpPut("poi-content")]
    public async Task<ActionResult<ApiResponse<OwnerShopDashboard>>> UpdatePoiContent([FromBody] UpdateOwnerPoiContentRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "Username is required"));
        }

        var sourceLanguage = NormalizePoiLanguageCode(request.SourceLanguage) ?? "vi";
        var sourceName = !string.IsNullOrWhiteSpace(request.SourceName)
            ? request.SourceName.Trim()
            : ResolveLegacyPoiName(request, sourceLanguage);
        var sourceDescription = !string.IsNullOrWhiteSpace(request.SourceDescription)
            ? request.SourceDescription.Trim()
            : ResolveLegacyPoiDescription(request, sourceLanguage);

        if (string.IsNullOrWhiteSpace(sourceName)
            || string.IsNullOrWhiteSpace(sourceDescription))
        {
            return BadRequest(new ApiResponse<OwnerShopDashboard>(null!, false, "POI name and description are required"));
        }

        var dashboard = await ownerRepository.UpdatePoiContentAsync(username, request);
        if (dashboard is null)
        {
            return NotFound(new ApiResponse<OwnerShopDashboard>(null!, false, "Owner POI not found"));
        }

        var poiId = dashboard.PrimaryPoi?.PoiId; 

        if (poiId != null) // Đảm bảo POI tồn tại
        {
            string[] targetLanguages = new[] { "vi", "en", "zh", "ja", "ko", "fr", "th" };

            foreach (var lang in targetLanguages)
            {
                // Gọi API dịch thuật (Hàm này vẫn cần await vì nó gọi ra ngoài internet)
                var (translatedName, translatedDesc) =
                    lang == sourceLanguage
                        ? (sourceName, sourceDescription)
                        : await translationService.TranslatePoiContentAsync(
                            sourceName,
                            sourceDescription,
                            lang,
                            sourceLanguage);

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

        var menuValidationError = ValidateMenuItemRequest(request);
        if (menuValidationError is not null)
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, menuValidationError));
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

        var menuValidationError = ValidateMenuItemRequest(request);
        if (menuValidationError is not null)
        {
            return BadRequest(new ApiResponse<MenuItemSummary>(null!, false, menuValidationError));
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

    private static string? ValidateMenuItemRequest(UpsertMenuItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Price < 0)
        {
            return "Invalid menu item data";
        }

        var imageUrl = request.ImageUrl?.Trim();
        if (string.IsNullOrEmpty(imageUrl))
        {
            return null;
        }

        if (imageUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            return "Image URL must be a public image link, not a base64/data URL";
        }

        if (imageUrl.Length > MaxMenuImageUrlLength)
        {
            return $"Image URL must be at most {MaxMenuImageUrlLength} characters";
        }

        return null;
    }

    private static string? NormalizePoiLanguageCode(string? languageCode)
    {
        var normalized = languageCode?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "vi" or "en" or "zh" or "ja" or "ko" or "fr" or "th" => normalized,
            "zh-cn" or "zh-tw" or "cn" => "zh",
            "jp" => "ja",
            "kr" => "ko",
            _ => null
        };
    }

    private static string ResolveLegacyPoiName(UpdateOwnerPoiContentRequest request, string sourceLanguage)
    {
        if (sourceLanguage == "en" && !string.IsNullOrWhiteSpace(request.NameEn))
        {
            return request.NameEn.Trim();
        }

        return request.NameVi?.Trim() ?? string.Empty;
    }

    private static string ResolveLegacyPoiDescription(UpdateOwnerPoiContentRequest request, string sourceLanguage)
    {
        if (sourceLanguage == "en" && !string.IsNullOrWhiteSpace(request.DescriptionEn))
        {
            return request.DescriptionEn.Trim();
        }

        return request.DescriptionVi?.Trim() ?? string.Empty;
    }

}
