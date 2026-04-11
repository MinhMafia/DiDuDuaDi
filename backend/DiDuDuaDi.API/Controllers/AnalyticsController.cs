using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController(IAnalyticsRepository analyticsRepository) : ControllerBase
{
    [HttpPost("poi-view")]
    public ActionResult<ApiResponse<bool>> TrackPoiView([FromBody] TrackPoiEventRequest request)
    {
        var tracked = analyticsRepository.TrackPoiView(request.PoiId, request.LanguageCode, request.Source);
        return Ok(new ApiResponse<bool>(tracked, tracked, tracked ? "POI view tracked" : "POI has no linked shop"));
    }

    [HttpPost("audio-play")]
    public ActionResult<ApiResponse<bool>> TrackAudioPlay([FromBody] TrackPoiEventRequest request)
    {
        var tracked = analyticsRepository.TrackAudioPlay(request.PoiId, request.LanguageCode, request.Source);
        return Ok(new ApiResponse<bool>(tracked, tracked, tracked ? "Audio play tracked" : "POI has no linked shop"));
    }

    [HttpGet("top-shops")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<IReadOnlyList<TopShopSummary>>> GetTopShops(
        [FromQuery] int days = 30, 
        [FromQuery] int limit = 10, 
        [FromQuery] string metric = "visits")
    {
        if (!new[] { "visits", "audio" }.Contains(metric.ToLower()))
        {
            return BadRequest(new ApiResponse<IReadOnlyList<TopShopSummary>>([], false, "Invalid metric. Use 'visits' or 'audio'."));
        }
        var data = analyticsRepository.GetTopShops(days, limit, metric);
        return Ok(new ApiResponse<IReadOnlyList<TopShopSummary>>(data));
    }

    [HttpGet("top-pois")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<IReadOnlyList<TopPoiSummary>>> GetTopPois(
        [FromQuery] int days = 30, 
        [FromQuery] int limit = 10, 
        [FromQuery] string metric = "visits")
    {
        if (!new[] { "visits", "audio" }.Contains(metric.ToLower()))
        {
            return BadRequest(new ApiResponse<IReadOnlyList<TopPoiSummary>>([], false, "Invalid metric. Use 'visits' or 'audio'."));
        }
        var data = analyticsRepository.GetTopPois(days, limit, metric);
        return Ok(new ApiResponse<IReadOnlyList<TopPoiSummary>>(data));
    }
}

