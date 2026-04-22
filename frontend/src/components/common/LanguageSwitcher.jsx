import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { setLanguage } from "../../store/slices/appSlice";
import "./LanguageSwitcher.css";

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
    <div className="language-switcher">
      <span className="language-switcher__label">{t("settings.language")}</span>
      <div className="language-switcher__track">
        {SUPPORTED_LANGUAGES.map((language) => {
          const isActive = currentLanguage === language.code;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => handleChangeLanguage(language.code)}
              title={language.nativeLabel}
              className={`language-switcher__button${
                isActive ? " language-switcher__button--active" : ""
              }`}
            >
              {language.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
