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

    public MistralChatService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> AskAsync(IReadOnlyCollection<AiChatMessage> messages, CancellationToken cancellationToken = default)
    {
        if (messages.Count == 0)
        {
            throw new InvalidOperationException("At least one message is required.");
        }

        var apiKey = _configuration["Mistral:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Missing Mistral:ApiKey configuration.");
        }

        var endpoint = _configuration["Mistral:Endpoint"]?.Trim()
            ?? "https://api.mistral.ai/v1/chat/completions";
        var model = _configuration["Mistral:Model"]?.Trim()
            ?? "mistral-small-latest";

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
            throw new InvalidOperationException(
                $"Mistral request failed with status {(int)response.StatusCode}: {responseBody}");
        }

        using var document = JsonDocument.Parse(responseBody);
        var choices = document.RootElement.GetProperty("choices");
        if (choices.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Mistral response did not include any choices.");
        }

        var contentElement = choices[0].GetProperty("message").GetProperty("content");
        return ReadContent(contentElement);
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
}
