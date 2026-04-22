using DiDuDuaDi.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(AppStartupState startupState) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var payload = new
        {
            success = startupState.DatabaseReady,
            status = startupState.DatabaseReady ? "healthy" : "degraded",
            message = startupState.DatabaseReady
                ? "Backend is running and database is ready."
                : "Backend is running but database initialization failed.",
            databaseReady = startupState.DatabaseReady,
            databaseInitializationError = startupState.DatabaseInitializationError,
            serverTime = DateTime.UtcNow,
            startedAtUtc = startupState.StartedAtUtc
        };

        if (!startupState.DatabaseReady)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, payload);
        }

        return Ok(payload);
    }
}
