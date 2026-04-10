using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace DiDuDuaDi.API.Services
{
    public interface ITextToSpeechService
    {
        Task<string?> GenerateAndSaveAudioAsync(string text, string languageCode, string poiId);
    }

    public class GoogleFreeTextToSpeechService : ITextToSpeechService
    {
        private readonly IWebHostEnvironment _env;
        private readonly HttpClient _httpClient;

        public GoogleFreeTextToSpeechService(IWebHostEnvironment env, HttpClient httpClient)
        {
            _env = env;
            _httpClient = httpClient;
        }

        public async Task<string?> GenerateAndSaveAudioAsync(string text, string languageCode, string poiId)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;

            if (text.Length > 200)
            {
            text = text.Substring(0, 197) + "...";
            }

            string ttsLangCode = languageCode.ToLower() == "zh" ? "zh-CN" : languageCode;

            string encodedText = HttpUtility.UrlEncode(text);
            string url = $"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q={encodedText}&tl={ttsLangCode}";

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[TTS ERROR] Không thể tạo Audio cho ngôn ngữ '{languageCode}'. Lỗi từ Google: {response.StatusCode}");
                return null; 
            }

            byte[] audioBytes = await response.Content.ReadAsByteArrayAsync();

            string webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string uploadsFolder = Path.Combine(webRootPath, "audios", "pois");
    
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string fileName = $"{poiId}_{languageCode}.mp3";
            string filePath = Path.Combine(uploadsFolder, fileName);

            await File.WriteAllBytesAsync(filePath, audioBytes);

            long timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            return $"wwwroot/audios/pois/{fileName}?v={timestamp}";
        }
    }
}