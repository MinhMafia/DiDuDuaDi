import { useMemo, useState } from "react";
import {
  getBackendHealth,
  getNearbyPois,
  getPois,
} from "../services/healthService";
import "./HomePage.css";

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState("Chua kiem tra");
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
      setHealthStatus(health.message || "Backend connected");
      setServerTime(health.serverTime || "");
    } catch (err) {
      setHealthStatus("Ket noi that bai");
      setError(err?.message || "Khong the ket noi backend");
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
      setError(err?.message || "Khong goi duoc API POIs");
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
      setError(err?.message || "Khong goi duoc API Nearby");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="home-page">
      <div className="hero-card">
        <h1>DiDuDuaDi Test Dashboard</h1>
        <p>Giao dien co ban de kiem tra frontend da ket noi backend chua.</p>
      </div>

      <div className="stats-grid">
        <article className="status-card">
          <p className="label">Backend status</p>
          <p className={backendOk ? "value ok" : "value"}>{healthStatus}</p>
        </article>
        <article className="status-card">
          <p className="label">Server time</p>
          <p className="value">{serverTime || "-"}</p>
        </article>
        <article className="status-card">
          <p className="label">Tong POI</p>
          <p className="value">{poiCount ?? "-"}</p>
        </article>
      </div>

      <div className="controls-card">
        <div className="button-row">
          <button type="button" onClick={testConnection} disabled={loading}>
            Test Health API
          </button>
          <button type="button" onClick={testPoisApi} disabled={loading}>
            Test POIs API
          </button>
          <button type="button" onClick={testNearbyApi} disabled={loading}>
            Test Nearby API
          </button>
        </div>

        <div className="input-row">
          <label>
            Lat
            <input value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>
          <label>
            Lng
            <input value={lng} onChange={(e) => setLng(e.target.value)} />
          </label>
          <label>
            Radius (m)
            <input
              type="number"
              min="50"
              max="2000"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </label>
        </div>

        {error ? <p className="error-text">Loi: {error}</p> : null}
        {loading ? <p className="hint">Dang tai du lieu...</p> : null}
      </div>

      <div className="list-card">
        <h2>POI gan day</h2>
        {nearbyPois.length === 0 ? (
          <p className="hint">
            Chua co du lieu. Bam "Test Nearby API" de xem ket qua.
          </p>
        ) : (
          <ul>
            {nearbyPois.map((poi) => (
              <li key={poi.id}>
                <strong>{poi.name}</strong>
                <span>{poi.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
