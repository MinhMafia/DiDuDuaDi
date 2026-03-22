using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POIsController(IPoiRepository repository) : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyList<POI>>> GetAll()
    {
        var data = repository.GetAll();
        return Ok(new ApiResponse<IReadOnlyList<POI>>(data));
    }

    [HttpGet("nearby")]
    public ActionResult<ApiResponse<IReadOnlyList<POI>>> GetNearby(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radius = 500)
    {
        if (lat is < -90 or > 90 || lng is < -180 or > 180)
        {
            return BadRequest(new ApiResponse<IReadOnlyList<POI>>([], false, "Invalid coordinates"));
        }

        var data = repository.GetNearby(lat, lng, radius);
        return Ok(new ApiResponse<IReadOnlyList<POI>>(data));
    }
}
