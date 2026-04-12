using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Collections.Generic;
using System.Linq;
using System;

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

            string ttsLangCode = languageCode.ToLower() == "zh" ? "zh-CN" : languageCode;

            var chunks = SplitText(text, 200);
            var finalAudioBytes = new List<byte>();

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            foreach (var chunk in chunks)
            {
                string encodedText = HttpUtility.UrlEncode(chunk);
                string url = $"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q={encodedText}&tl={ttsLangCode}";

                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[TTS ERROR] Không thể tạo Audio cho đoạn: '{chunk}'. Lỗi: {response.StatusCode}");
                    continue; 
                }

                byte[] chunkBytes = await response.Content.ReadAsByteArrayAsync();
                
                finalAudioBytes.AddRange(chunkBytes);
                
                await Task.Delay(100); 
            }

            if (finalAudioBytes.Count == 0) return null;

            string webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string uploadsFolder = Path.Combine(webRootPath, "audios", "pois");
    
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string fileName = $"{poiId}_{languageCode}.mp3";
            string filePath = Path.Combine(uploadsFolder, fileName);

            await File.WriteAllBytesAsync(filePath, finalAudioBytes.ToArray());

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            return $"/audios/pois/{fileName}?v={timestamp}";
        }

        private List<string> SplitText(string text, int maxLength)
        {
            var chunks = new List<string>();
            var words = text.Split(new[] { ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            var currentChunk = "";

            foreach (var word in words)
            {
                if (currentChunk.Length + word.Length + 1 > maxLength)
                {
                    if (!string.IsNullOrEmpty(currentChunk))
                    {
                        chunks.Add(currentChunk.Trim());
                    }
                    currentChunk = word;
                }
                else
                {
                    currentChunk += (string.IsNullOrEmpty(currentChunk) ? "" : " ") + word;
                }
            }

            if (!string.IsNullOrEmpty(currentChunk))
            {
                chunks.Add(currentChunk.Trim());
            }

            return chunks;
        }
    }
}