import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { setLanguage } from "../../store/slices/appSlice";

export default function LanguageSwitcher() {
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state) => state.app.language);
  const { i18n, t } = useTranslation();

  function handleChangeLanguage(language) {
    dispatch(setLanguage(language));
    i18n.changeLanguage(language);
    window.localStorage.setItem("didududadi.language", language);
  }

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
        {t("settings.language")}
      </span>
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = currentLanguage === language.code;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => handleChangeLanguage(language.code)}
            title={language.nativeLabel}
            style={{
              border: "1px solid",
              borderColor: isActive ? "#ff6b35" : "#cbd5e1",
              background: isActive ? "#fff1eb" : "#fff",
              color: isActive ? "#c2410c" : "#334155",
              padding: "8px 10px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
