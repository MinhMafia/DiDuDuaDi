using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Services;

public interface IMistralChatService
{
    Task<string> AskAsync(IReadOnlyCollection<AiChatMessage> messages, CancellationToken cancellationToken = default);
}

public class MistralChatService : IMistralChatService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MistralChatService> _logger;

    public MistralChatService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MistralChatService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> AskAsync(IReadOnlyCollection<AiChatMessage> messages, CancellationToken cancellationToken = default)
    {
        if (messages.Count == 0)
        {
            throw new InvalidOperationException("At least one message is required.");
        }

        var apiKey = _configuration["Mistral:ApiKey"];
        if (!HasUsableApiKey(apiKey))
        {
            _logger.LogWarning("Mistral API key is missing or still using a placeholder value. Falling back to local chat response.");
            return BuildFallbackReply(messages);
        }

        var endpoint = _configuration["Mistral:Endpoint"]?.Trim()
            ?? "https://api.mistral.ai/v1/chat/completions";
        var model = _configuration["Mistral:Model"]?.Trim()
            ?? "mistral-small-latest";

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(
                        new
                        {
                            model,
                            messages = messages.Select(message => new
                            {
                                role = NormalizeRole(message.Role),
                                content = message.Text
                            })
                        },
                        JsonOptions),
                    Encoding.UTF8,
                    "application/json")
            };

            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Mistral request failed with status {StatusCode}. Falling back to local chat response. Response: {ResponseBody}",
                    (int)response.StatusCode,
                    Truncate(responseBody, 500));
                return BuildFallbackReply(messages);
            }

            using var document = JsonDocument.Parse(responseBody);
            var choices = document.RootElement.GetProperty("choices");
            if (choices.GetArrayLength() == 0)
            {
                _logger.LogWarning("Mistral response did not include any choices. Falling back to local chat response.");
                return BuildFallbackReply(messages);
            }

            var contentElement = choices[0].GetProperty("message").GetProperty("content");
            var reply = ReadContent(contentElement);

            if (string.IsNullOrWhiteSpace(reply))
            {
                _logger.LogWarning("Mistral returned an empty reply. Falling back to local chat response.");
                return BuildFallbackReply(messages);
            }

            return reply;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while calling Mistral. Falling back to local chat response.");
            return BuildFallbackReply(messages);
        }
    }

    private static string NormalizeRole(string? role)
    {
        if (string.Equals(role, "assistant", StringComparison.OrdinalIgnoreCase))
        {
            return "assistant";
        }

        if (string.Equals(role, "system", StringComparison.OrdinalIgnoreCase))
        {
            return "system";
        }

        return "user";
    }

    private static string ReadContent(JsonElement contentElement)
    {
        if (contentElement.ValueKind == JsonValueKind.String)
        {
            return contentElement.GetString() ?? string.Empty;
        }

        if (contentElement.ValueKind == JsonValueKind.Array)
        {
            var parts = contentElement
                .EnumerateArray()
                .Select(item =>
                {
                    if (item.ValueKind == JsonValueKind.Object
                        && item.TryGetProperty("text", out var textElement))
                    {
                        return textElement.GetString();
                    }

                    return item.ToString();
                })
                .Where(text => !string.IsNullOrWhiteSpace(text));

            return string.Join(Environment.NewLine, parts!);
        }

        return contentElement.ToString();
    }

    private static bool HasUsableApiKey(string? apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return false;
        }

        return !apiKey.StartsWith("SET_THIS_", StringComparison.OrdinalIgnoreCase)
            && !apiKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(apiKey.Trim(), "changeme", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildFallbackReply(IReadOnlyCollection<AiChatMessage> messages)
    {
        var lastUserMessage = messages
            .LastOrDefault(message => string.Equals(NormalizeRole(message.Role), "user", StringComparison.OrdinalIgnoreCase))
            ?.Text
            ?.Trim() ?? string.Empty;

        var pois = ExtractPois(messages);
        var language = DetectReplyLanguage(lastUserMessage);
        var matchedPois = MatchPois(lastUserMessage, pois);

        if (IsGreeting(lastUserMessage))
        {
            return language == "vi"
                ? BuildVietnameseGreetingReply(pois)
                : BuildEnglishGreetingReply(pois);
        }

        if (matchedPois.Count > 0)
        {
            return language == "vi"
                ? BuildVietnameseMatchedReply(matchedPois)
                : BuildEnglishMatchedReply(matchedPois);
        }

        if (LooksLikeRecommendationQuestion(lastUserMessage))
        {
            var suggestions = pois.Take(3).ToList();
            return language == "vi"
                ? BuildVietnameseRecommendationReply(suggestions)
                : BuildEnglishRecommendationReply(suggestions);
        }

        if (pois.Count > 0)
        {
            var suggestions = pois.Take(3).ToList();
            return language == "vi"
                ? BuildVietnameseGenericReply(suggestions)
                : BuildEnglishGenericReply(suggestions);
        }

        return language == "vi"
            ? "Mình đang ở chế độ trả lời nhanh. Bạn hãy hỏi tên quán hoặc món muốn tìm ở phố ẩm thực Vĩnh Khánh, mình sẽ gợi ý ngắn gọn."
            : "I am currently in quick reply mode. Ask me about a specific shop or dish on Vinh Khanh food street and I will give a short suggestion.";
    }

    private static List<PoiFallbackItem> ExtractPois(IReadOnlyCollection<AiChatMessage> messages)
    {
        var systemText = messages
            .LastOrDefault(message => string.Equals(NormalizeRole(message.Role), "system", StringComparison.OrdinalIgnoreCase))
            ?.Text;

        if (string.IsNullOrWhiteSpace(systemText))
        {
            return [];
        }

        return systemText
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Skip(1)
            .Select(line =>
            {
                var separatorIndex = line.IndexOf(':');
                if (separatorIndex <= 0 || separatorIndex >= line.Length - 1)
                {
                    return null;
                }

                var name = line[..separatorIndex].Trim();
                var description = line[(separatorIndex + 1)..].Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    return null;
                }

                return new PoiFallbackItem(name, description);
            })
            .Where(item => item is not null)
            .Cast<PoiFallbackItem>()
            .DistinctBy(item => item.Name)
            .ToList();
    }

    private static List<PoiFallbackItem> MatchPois(string prompt, IReadOnlyCollection<PoiFallbackItem> pois)
    {
        var normalizedPrompt = NormalizeForSearch(prompt);
        if (string.IsNullOrWhiteSpace(normalizedPrompt))
        {
            return [];
        }

        return pois
            .Where(poi =>
                normalizedPrompt.Contains(NormalizeForSearch(poi.Name))
                || NormalizeForSearch(poi.Description).Contains(normalizedPrompt)
                || normalizedPrompt.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Any(token => token.Length >= 3
                        && (NormalizeForSearch(poi.Name).Contains(token)
                            || NormalizeForSearch(poi.Description).Contains(token))))
            .Take(3)
            .ToList();
    }

    private static string DetectReplyLanguage(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return "vi";
        }

        if (text.Any(ch => ch is >= '\u0E00' and <= '\u0E7F'))
        {
            return "en";
        }

        if (text.Any(ch => ch is >= '\u3040' and <= '\u30FF'))
        {
            return "en";
        }

        if (text.Any(ch => ch is >= '\uAC00' and <= '\uD7AF'))
        {
            return "en";
        }

        if (text.Any(ch => ch is >= '\u4E00' and <= '\u9FFF'))
        {
            return "en";
        }

        if (ContainsVietnameseMarkers(text))
        {
            return "vi";
        }

        return "en";
    }

    private static bool ContainsVietnameseMarkers(string text)
    {
        var normalized = NormalizeForSearch(text);
        var vietnameseKeywords = new[]
        {
            "quan",
            "mon",
            "an gi",
            "goi y",
            "gan day",
            "o dau",
            "pho am thuc",
            "vinh khanh",
            "ngon",
            "hi",
            "xin chao"
        };

        return text.Any(ch => "ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ".Contains(char.ToLowerInvariant(ch)))
            || vietnameseKeywords.Any(keyword => normalized.Contains(keyword));
    }

    private static bool IsGreeting(string prompt)
    {
        var normalizedPrompt = NormalizeForSearch(prompt);
        if (string.IsNullOrWhiteSpace(normalizedPrompt))
        {
            return true;
        }

        return normalizedPrompt is "hi" or "hello" or "helo" or "hey" or "xin chao" or "chao" or "alo";
    }

    private static bool LooksLikeRecommendationQuestion(string prompt)
    {
        var normalizedPrompt = NormalizeForSearch(prompt);
        var keywords = new[]
        {
            "an gi",
            "goi y",
            "recommend",
            "suggest",
            "quan nao",
            "mon nao",
            "what should i eat",
            "what to eat",
            "nearby",
            "gan day"
        };

        return keywords.Any(keyword => normalizedPrompt.Contains(keyword));
    }

    private static string NormalizeForSearch(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        return text
            .Normalize(NormalizationForm.FormD)
            .Where(ch => char.GetUnicodeCategory(ch) != System.Globalization.UnicodeCategory.NonSpacingMark)
            .Aggregate(new StringBuilder(), (builder, ch) => builder.Append(char.ToLowerInvariant(ch)))
            .ToString();
    }

    private static string BuildVietnameseGreetingReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 0)
        {
            return "Xin chào. Bạn có thể hỏi mình nên ăn gì, quán nào đang có trên bản đồ, hoặc hỏi tên một quán cụ thể để mình giới thiệu ngắn gọn.";
        }

        var names = string.Join(", ", pois.Take(3).Select(poi => poi.Name));
        return $"Xin chào. Mình có thể gợi ý nhanh về các quán ở Vĩnh Khánh như {names}. Bạn hãy hỏi món muốn ăn hoặc tên một quán cụ thể nhé.";
    }

    private static string BuildEnglishGreetingReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 0)
        {
            return "Hello. You can ask what to eat, which shops are on the map, or mention a specific shop name for a short introduction.";
        }

        var names = string.Join(", ", pois.Take(3).Select(poi => poi.Name));
        return $"Hello. I can quickly suggest places on Vinh Khanh food street such as {names}. Ask me what to eat or mention a specific shop.";
    }

    private static string BuildVietnameseMatchedReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 1)
        {
            var poi = pois[0];
            return $"{poi.Name}: {poi.Description} Nếu bạn muốn, mình có thể gợi ý thêm món nên thử hoặc quán tương tự gần đó.";
        }

        var lines = pois.Select((poi, index) => $"{index + 1}. {poi.Name}: {poi.Description}");
        return $"Mình tìm thấy vài quán phù hợp:\n{string.Join("\n", lines)}\nBạn muốn mình nói kỹ hơn về quán nào?";
    }

    private static string BuildEnglishMatchedReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 1)
        {
            var poi = pois[0];
            return $"{poi.Name}: {poi.Description} If you want, I can also suggest what to try there or recommend a similar nearby place.";
        }

        var lines = pois.Select((poi, index) => $"{index + 1}. {poi.Name}: {poi.Description}");
        return $"I found a few matching places:\n{string.Join("\n", lines)}\nTell me which one you want to explore further.";
    }

    private static string BuildVietnameseRecommendationReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 0)
        {
            return "Mình chưa có đủ dữ liệu quán để gợi ý. Bạn thử hỏi tên một quán cụ thể trên bản đồ nhé.";
        }

        var lines = pois.Select((poi, index) => $"{index + 1}. {poi.Name}: {poi.Description}");
        return $"Bạn có thể bắt đầu với các gợi ý này:\n{string.Join("\n", lines)}\nNếu thích, mình có thể giúp chọn quán theo kiểu món bạn muốn ăn.";
    }

    private static string BuildEnglishRecommendationReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        if (pois.Count == 0)
        {
            return "I do not have enough place data yet. Try asking for a specific shop shown on the map.";
        }

        var lines = pois.Select((poi, index) => $"{index + 1}. {poi.Name}: {poi.Description}");
        return $"You can start with these suggestions:\n{string.Join("\n", lines)}\nIf you want, I can narrow them down by dish type or mood.";
    }

    private static string BuildVietnameseGenericReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        var names = string.Join(", ", pois.Select(poi => poi.Name));
        return $"Hiện mình đang trả lời ở chế độ nhanh. Bạn có thể hỏi cụ thể về {names}, hoặc hỏi mình nên ăn gì để mình gợi ý ngắn gọn hơn.";
    }

    private static string BuildEnglishGenericReply(IReadOnlyList<PoiFallbackItem> pois)
    {
        var names = string.Join(", ", pois.Select(poi => poi.Name));
        return $"I am replying in quick mode right now. You can ask specifically about {names}, or ask what to eat and I will suggest a few suitable options.";
    }

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
        {
            return value ?? string.Empty;
        }

        return $"{value[..maxLength]}...";
    }

    private sealed record PoiFallbackItem(string Name, string Description);
}
