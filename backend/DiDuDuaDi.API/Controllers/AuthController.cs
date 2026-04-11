using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthRepository authRepository, ITokenService tokenService) : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<ApiResponse<AuthSession>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ApiResponse<AuthSession>(null!, false, "Username and password are required"));
        }

        var authUser = authRepository.ValidateCredentials(request.Username, request.Password);
        if (authUser is null)
        {
            return Unauthorized(new ApiResponse<AuthSession>(null!, false, "Invalid username or password"));
        }

        return Ok(new ApiResponse<AuthSession>(tokenService.CreateSession(authUser), true, "Login successful"));
    }

    [HttpPost("register")]
    public ActionResult<ApiResponse<AuthSession>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || string.IsNullOrWhiteSpace(request.Password)
            || string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return BadRequest(new ApiResponse<AuthSession>(null!, false, "Username, password and display name are required"));
        }

        if (request.Username.Trim().Length < 3)
        {
            return BadRequest(new ApiResponse<AuthSession>(null!, false, "Username must be at least 3 characters"));
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new ApiResponse<AuthSession>(null!, false, "Password must be at least 6 characters"));
        }

        var created = authRepository.Register(request);
        if (created is null)
        {
            return Conflict(new ApiResponse<AuthSession>(null!, false, "Username already exists"));
        }

        return Ok(new ApiResponse<AuthSession>(tokenService.CreateSession(created), true, "Register successful"));
    }

    [HttpPost("owner-upgrade-request")]
    [Authorize(Roles = "user")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary>> CreateOwnerUpgradeRequest([FromBody] CreateOwnerUpgradeRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrWhiteSpace(username)
            || string.IsNullOrWhiteSpace(request.ShopName)
            || string.IsNullOrWhiteSpace(request.AddressLine))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Username, shop name and address are required"));
        }

        var normalizedRequest = request with { Username = username };
        var role = authRepository.GetRoleCodeByUsername(username);
        if (string.IsNullOrWhiteSpace(role))
        {
            return NotFound(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "User does not exist or is inactive"));
        }

        if (!string.Equals(role, "user", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Only user accounts can submit owner upgrade requests"));
        }

        if (authRepository.HasPendingOwnerUpgradeRequest(username))
        {
            return Conflict(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "You already have a pending owner upgrade request"));
        }

        var created = authRepository.CreateOwnerUpgradeRequest(normalizedRequest);
        if (created is null)
        {
            return Conflict(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Unable to create owner upgrade request"));
        }

        return Ok(new ApiResponse<OwnerUpgradeRequestSummary>(created, true, "Owner upgrade request submitted"));
    }

    [HttpGet("owner-upgrade-requests")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<IReadOnlyList<OwnerUpgradeRequestSummary>>> GetOwnerUpgradeRequests([FromQuery] string? status)
    {
        var requests = authRepository.GetOwnerUpgradeRequests(status);
        return Ok(new ApiResponse<IReadOnlyList<OwnerUpgradeRequestSummary>>(requests));
    }

    [HttpGet("my-owner-upgrade-request")]
    [Authorize(Roles = "user")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary?>> GetMyOwnerUpgradeRequest()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary?>(null, false, "Username is required"));
        }

        var request = authRepository.GetLatestOwnerUpgradeRequest(username);
        return Ok(new ApiResponse<OwnerUpgradeRequestSummary?>(request, true));
    }

    [HttpPost("owner-upgrade-requests/{requestId:long}/approve")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary>> ApproveOwnerUpgradeRequest(long requestId)
    {
        var adminUsername = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(adminUsername))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "adminUsername is required"));
        }

        var approved = authRepository.ApproveOwnerUpgradeRequest(requestId, adminUsername);
        if (approved is null)
        {
            return NotFound(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Request not found, already reviewed, or admin invalid"));
        }

        return Ok(new ApiResponse<OwnerUpgradeRequestSummary>(approved, true, "Payment QR generated successfully"));
    }

    [HttpPost("owner-upgrade-requests/{requestId:long}/review")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary>> ReviewOwnerUpgradeRequest(long requestId, [FromBody] ReviewOwnerUpgradeRequest request)
    {
        var adminUsername = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(adminUsername))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "adminUsername is required"));
        }

        if (string.IsNullOrWhiteSpace(request.Action))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Action is required"));
        }

        var reviewed = authRepository.ReviewOwnerUpgradeRequest(requestId, adminUsername, request.Action, request.Reason);
        if (reviewed is null)
        {
            return NotFound(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Request not found, already reviewed, or action invalid"));
        }

        return Ok(new ApiResponse<OwnerUpgradeRequestSummary>(reviewed, true, "Owner upgrade request reviewed successfully"));
    }

    [HttpPost("owner-upgrade-requests/{requestId:long}/confirm-payment")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary>> ConfirmOwnerUpgradePayment(long requestId)
    {
        var adminUsername = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(adminUsername))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "adminUsername is required"));
        }

        var confirmed = authRepository.ConfirmOwnerUpgradePayment(requestId, adminUsername);
        if (confirmed is null)
        {
            return NotFound(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Request not found, not waiting payment, or admin invalid"));
        }

        return Ok(new ApiResponse<OwnerUpgradeRequestSummary>(confirmed, true, "Owner role activated after payment"));
    }

    [HttpPost("owner-upgrade-requests/{requestId:long}/cancel-payment")]
    [Authorize(Roles = "admin")]
    public ActionResult<ApiResponse<OwnerUpgradeRequestSummary>> CancelOwnerUpgradePayment(long requestId)
    {
        var adminUsername = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(adminUsername))
        {
            return BadRequest(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "adminUsername is required"));
        }

        var canceled = authRepository.CancelOwnerUpgradePayment(requestId, adminUsername);
        if (canceled is null)
        {
            return NotFound(new ApiResponse<OwnerUpgradeRequestSummary>(null!, false, "Request not found, not waiting payment, or admin invalid"));
        }

        return Ok(new ApiResponse<OwnerUpgradeRequestSummary>(canceled, true, "Payment QR canceled successfully"));
    }
}
