import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getBackendHealth,
  getNearbyPois,
  getPois,
} from "../services/healthService";
import "./HomePage.css";
import { getLocalizedValue } from "../utils/helpers";

export default function HomePage() {
  const { i18n, t } = useTranslation();
  const [healthStatus, setHealthStatus] = useState(t("home.healthNotChecked"));
  const [serverTime, setServerTime] = useState("");
  const [poiCount, setPoiCount] = useState(null);
  const [nearbyPois, setNearbyPois] = useState([]);
  const [radius, setRadius] = useState(500);
  const [lat, setLat] = useState("10.7620");
  const [lng, setLng] = useState("106.7030");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const backendOk = useMemo(
    () =>
      healthStatus.toLowerCase().includes("running") ||
      healthStatus.toLowerCase().includes("connected"),
    [healthStatus],
  );

  async function testConnection() {
    try {
      setError("");
      setLoading(true);
      const health = await getBackendHealth();
      setHealthStatus(health.message || t("home.healthConnected"));
      setServerTime(health.serverTime || "");
    } catch (err) {
      setHealthStatus(t("home.healthFailed"));
      setError(err?.message || t("home.connectError"));
    } finally {
      setLoading(false);
    }
  }

  async function testPoisApi() {
    try {
      setError("");
      setLoading(true);
      const pois = await getPois();
      const count = Array.isArray(pois?.data) ? pois.data.length : 0;
      setPoiCount(count);
      setNearbyPois([]);
    } catch (err) {
      setError(err?.message || t("home.poiApiError"));
    } finally {
      setLoading(false);
    }
  }

  async function testNearbyApi() {
    try {
      setError("");
      setLoading(true);
      const result = await getNearbyPois(
        Number(lat),
        Number(lng),
        Number(radius),
      );
      setNearbyPois(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setNearbyPois([]);
      setError(err?.message || t("home.nearbyApiError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="home-page">
      <div className="hero-card">
        <h1>{t("home.title")}</h1>
        <p>{t("home.subtitle")}</p>
      </div>

      <div className="stats-grid">
        <article className="status-card">
          <p className="label">{t("home.labels.backendStatus")}</p>
          <p className={backendOk ? "value ok" : "value"}>{healthStatus}</p>
        </article>
        <article className="status-card">
          <p className="label">{t("home.labels.serverTime")}</p>
          <p className="value">{serverTime || "-"}</p>
        </article>
        <article className="status-card">
          <p className="label">{t("home.labels.totalPoi")}</p>
          <p className="value">{poiCount ?? "-"}</p>
        </article>
      </div>

      <div className="controls-card">
        <div className="button-row">
          <button type="button" onClick={testConnection} disabled={loading}>
            {t("home.actions.testHealth")}
          </button>
          <button type="button" onClick={testPoisApi} disabled={loading}>
            {t("home.actions.testPois")}
          </button>
          <button type="button" onClick={testNearbyApi} disabled={loading}>
            {t("home.actions.testNearby")}
          </button>
        </div>

        <div className="input-row">
          <label>
            {t("home.fields.lat")}
            <input value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>
          <label>
            {t("home.fields.lng")}
            <input value={lng} onChange={(e) => setLng(e.target.value)} />
          </label>
          <label>
            {t("home.fields.radius")}
            <input
              type="number"
              min="50"
              max="2000"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </label>
        </div>

        {error ? (
          <p className="error-text">
            {t("home.errorLabel")}: {error}
          </p>
        ) : null}
        {loading ? <p className="hint">{t("home.loading")}</p> : null}
      </div>

      <div className="list-card">
        <h2>{t("home.nearbyTitle")}</h2>
        {nearbyPois.length === 0 ? (
          <p className="hint">{t("home.emptyNearby")}</p>
        ) : (
          <ul>
            {nearbyPois.map((poi) => (
              <li key={poi.id}>
                <strong>{getLocalizedValue(poi.name, i18n.language)}</strong>
                <span>{poi.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
