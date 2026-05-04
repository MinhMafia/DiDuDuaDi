using GTranslate.Translators;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace DiDuDuaDi.API.Services
{
    public interface ITranslationService
    {
        Task<(string TranslatedName, string TranslatedDesc)> TranslatePoiContentAsync(
            string name,
            string desc,
            string targetLangCode);
    }

    public class GoogleFreeTranslationService : ITranslationService
    {
        private readonly GoogleTranslator _translator;
        private readonly HttpClient _httpClient;

        public GoogleFreeTranslationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _translator = new GoogleTranslator();
        }

        public async Task<(string TranslatedName, string TranslatedDesc)> TranslatePoiContentAsync(
            string name,
            string desc,
            string targetLangCode)
        {
            // Giữ nguyên tiếng Việt nếu là "vi", ngược lại bỏ dấu
            string translatedName = targetLangCode.Equals("vi", System.StringComparison.OrdinalIgnoreCase)
                ? name
                : RemoveDiacritics(name);
            string translatedDesc = desc;

            // Dịch Description (nếu có)
            if (!string.IsNullOrWhiteSpace(desc))
            {
                var resultDesc = await _translator.TranslateAsync(desc, targetLangCode, "vi");
                translatedDesc = resultDesc.Translation;
            }

            return (translatedName, translatedDesc);
        }

        // Hàm phụ trợ để bỏ dấu tiếng Việt
        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder(normalizedString.Length);

            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC)
                .Replace('đ', 'd').Replace('Đ', 'D');
        }
    }
}