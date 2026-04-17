using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/ai")]
public class AIController : ControllerBase
{
    private readonly IMistralChatService _mistralChatService;

    public AIController(IMistralChatService mistralChatService)
    {
        _mistralChatService = mistralChatService;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<ApiResponse<AiChatResponse>>> Chat(
        [FromBody] AiChatRequest request,
        CancellationToken cancellationToken)
    {
        var validMessages = (request.Messages ?? [])
            .Where(message => !string.IsNullOrWhiteSpace(message.Text))
            .ToList();

        if (validMessages.Count == 0)
        {
            return BadRequest(new ApiResponse<AiChatResponse>(
                new AiChatResponse(string.Empty),
                false,
                "Messages are required."));
        }

        try
        {
            var reply = await _mistralChatService.AskAsync(validMessages, cancellationToken);
            return Ok(new ApiResponse<AiChatResponse>(new AiChatResponse(reply)));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new ApiResponse<AiChatResponse>(
                new AiChatResponse(string.Empty),
                false,
                ex.Message));
        }
    }
}
