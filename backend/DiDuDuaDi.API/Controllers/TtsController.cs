using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private static readonly HttpClient HttpClient = new();

    [HttpGet("google")]
    public async Task<IActionResult> GetGoogleTts([FromQuery] string text, [FromQuery] string lang = "vi-VN")
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest(new { success = false, message = "Text is required" });
        }

        var shortLang = lang.Split('-')[0];
        var url = $"https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl={shortLang}&q={Uri.EscapeDataString(text)}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("Mozilla/5.0");

        using var response = await HttpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, new { success = false, message = "Unable to fetch TTS audio" });
        }

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);

        return File(memoryStream.ToArray(), "audio/mpeg");
    }
}