using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private static readonly HttpClient HttpClient = new();
    private static readonly IReadOnlyDictionary<string, string> GoogleTtsLanguageMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["vi"] = "vi",
            ["vi-vn"] = "vi",
            ["en"] = "en",
            ["en-us"] = "en",
            ["zh"] = "zh-CN",
            ["zh-cn"] = "zh-CN",
            ["zh-tw"] = "zh-TW",
            ["ja"] = "ja",
            ["ja-jp"] = "ja",
            ["ko"] = "ko",
            ["ko-kr"] = "ko",
            ["fr"] = "fr",
            ["fr-fr"] = "fr",
            ["th"] = "th",
            ["th-th"] = "th",
        };

    [HttpGet("google")]
    public async Task<IActionResult> GetGoogleTts([FromQuery] string text, [FromQuery] string lang = "vi-VN")
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest(new { success = false, message = "Text is required" });
        }

        var resolvedLang = ResolveGoogleTtsLanguage(lang);
        var url = $"https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl={Uri.EscapeDataString(resolvedLang)}&q={Uri.EscapeDataString(text)}";

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

    private static string ResolveGoogleTtsLanguage(string lang)
    {
        if (string.IsNullOrWhiteSpace(lang))
        {
            return "vi";
        }

        if (GoogleTtsLanguageMap.TryGetValue(lang.Trim(), out var resolved))
        {
            return resolved;
        }

        var shortLang = lang.Split('-', StringSplitOptions.RemoveEmptyEntries)[0];
        if (GoogleTtsLanguageMap.TryGetValue(shortLang, out resolved))
        {
            return resolved;
        }

        return shortLang;
    }
}
