using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthRepository authRepository) : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<ApiResponse<AuthUser>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ApiResponse<AuthUser>(null!, false, "Username and password are required"));
        }

        var authUser = authRepository.ValidateCredentials(request.Username, request.Password);
        if (authUser is null)
        {
            return Unauthorized(new ApiResponse<AuthUser>(null!, false, "Invalid username or password"));
        }

        return Ok(new ApiResponse<AuthUser>(authUser, true, "Login successful"));
    }
}
