using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Dapper;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POIsController(IPoiRepository repository, IDbConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyList<POI>>> GetAll()
    {
        var accountId = GetCurrentAccountId();
        var data = repository.GetAll(accountId);
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
        var accountId = GetCurrentAccountId();
        var data = repository.GetNearby(lat, lng, radius, accountId);
        return Ok(new ApiResponse<IReadOnlyList<POI>>(data));
    }

    [HttpGet("{id:guid}")]
    public ActionResult<ApiResponse<POI?>> GetById(Guid id)
    {
        var accountId = GetCurrentAccountId();
        var poi = repository.GetById(id, accountId);
        if (poi == null) return NotFound(new ApiResponse<POI?>(null, false, "POI not found"));
        return Ok(new ApiResponse<POI?>(poi));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<POI>> Create([FromBody] POI poi)
    {
        var result = repository.Add(poi);
        return Ok(new ApiResponse<POI>(result));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<POI?>> Update(Guid id, [FromBody] POI poi)
    {
        poi.Id = id;
        var existing = repository.GetById(id);
        if (existing == null) return NotFound(new ApiResponse<POI?>(null, false, "POI not found"));
        var result = repository.Update(poi);
        return Ok(new ApiResponse<POI?>(result));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<bool>> Delete(Guid id)
    {
        var success = repository.Delete(id);
        if (!success) return NotFound(new ApiResponse<bool>(false, false, "POI not found"));
        return Ok(new ApiResponse<bool>(true));
    }

    private Guid? GetCurrentAccountId()
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claimValue)) return null;

        if (Guid.TryParse(claimValue, out var accountId)) return accountId;

        using var connection = connectionFactory.CreateConnection();
        return connection.QuerySingleOrDefault<Guid?>("SELECT id FROM accounts WHERE username = @Username AND is_active = 1", new { Username = claimValue });
    }
}
