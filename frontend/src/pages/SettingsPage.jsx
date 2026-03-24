import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { setAutoPlayAudio } from "../store/slices/appSlice";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <article
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <h1 style={{ marginTop: 0 }}>{t("settings.title")}</h1>
        <p style={{ color: "#475569", marginBottom: 0 }}>{t("settings.subtitle")}</p>
      </article>

      <article
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <strong>{t("settings.language")}</strong>
        <LanguageSwitcher />
      </article>

      <article
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 20,
          display: "grid",
          gap: 8,
        }}
      >
        <strong>{t("settings.mapProviderTitle")}</strong>
        <p style={{ color: "#475569", margin: 0 }}>
          {t("settings.mapProviderDescription")}
        </p>
        <code style={{ background: "#f8fafc", padding: 12, borderRadius: 12 }}>
          OpenStreetMap + Leaflet
        </code>
      </article>

      <article
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <strong>{t("settings.autoPlayTitle")}</strong>
          <p style={{ color: "#475569", marginBottom: 0 }}>
            {t("settings.autoPlayDescription")}
          </p>
        </div>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            checked={autoPlayAudio}
            onChange={(event) => dispatch(setAutoPlayAudio(event.target.checked))}
          />
          {autoPlayAudio ? t("settings.enabled") : t("settings.disabled")}
        </label>
      </article>
    </section>
  );
}
