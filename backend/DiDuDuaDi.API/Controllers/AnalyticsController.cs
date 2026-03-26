using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
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
}
