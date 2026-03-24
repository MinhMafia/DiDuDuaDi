import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import fr from "./locales/fr.json";
import th from "./locales/th.json";

export const SUPPORTED_LANGUAGES = [
  { code: "vi", label: "VI", nativeLabel: "Tiếng Việt", speechLocale: "vi-VN" },
  { code: "en", label: "EN", nativeLabel: "English", speechLocale: "en-US" },
  { code: "zh", label: "中文", nativeLabel: "中文", speechLocale: "zh-CN" },
  { code: "ja", label: "日本語", nativeLabel: "日本語", speechLocale: "ja-JP" },
  { code: "ko", label: "한국어", nativeLabel: "한국어", speechLocale: "ko-KR" },
  { code: "fr", label: "FR", nativeLabel: "Français", speechLocale: "fr-FR" },
  { code: "th", label: "ไทย", nativeLabel: "ไทย", speechLocale: "th-TH" },
];

const initialLanguage =
  typeof window !== "undefined"
    ? window.localStorage.getItem("didududadi.language") || "vi"
    : "vi";

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
    ko: { translation: ko },
    fr: { translation: fr },
    th: { translation: th },
  },
  lng: initialLanguage,
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

export default i18n;
