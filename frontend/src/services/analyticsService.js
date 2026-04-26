import apiClient from "./apiClient";

const VISITOR_SESSION_KEY_STORAGE = "didududadi.visitorSessionKey";

export const getTopShops = (days = 30, limit = 10, metric = "visits") =>
  apiClient
    .get("/analytics/top-shops", { params: { days, limit, metric } })
    .then((r) => r.data.data);

export const getTopPois = (days = 30, limit = 10, metric = "visits") =>
  apiClient
    .get("/analytics/top-pois", { params: { days, limit, metric } })
    .then((r) => r.data);

export const getActiveVisitorsCount = (minutes = 5) =>
  apiClient
    .get("/analytics/active-visitors", { params: { minutes } })
    .then((r) => r.data.data ?? 0);

export const getTotalVisitorsCount = () =>
  apiClient
    .get("/analytics/total-visitors")
    .then((r) => r.data.data ?? 0);

// POI for manage
export const getPois = (params) =>
  apiClient.get("/pois", { params }).then((r) => r.data);
export const getPoiById = (id) =>
  apiClient.get(`/pois/${id}`).then((r) => r.data);
export const createPoi = (data) =>
  apiClient.post("/pois", data).then((r) => r.data);
export const updatePoi = (id, data) =>
  apiClient.put(`/pois/${id}`, data).then((r) => r.data);

export const deletePoi = (id) =>
  apiClient.delete(`/pois/${id}`).then((r) => r.data);

function normalizeTrackPoiEvent(poiIdOrEvent, languageCode = "vi", source = "map") {
  if (typeof poiIdOrEvent === "object" && poiIdOrEvent !== null) {
    return poiIdOrEvent;
  }

  return { poiId: poiIdOrEvent, languageCode, source };
}

export const trackPoiView = (poiId, languageCode = "vi", source = "map") =>
  apiClient
    .post("/analytics/poi-view", normalizeTrackPoiEvent(poiId, languageCode, source))
    .then((r) => r.data);

export const trackAudioPlay = (poiId, languageCode = "vi", source = "tts") =>
  apiClient
    .post("/analytics/audio-play", normalizeTrackPoiEvent(poiId, languageCode, source))
    .then((r) => r.data);

export function getVisitorSessionKey() {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(VISITOR_SESSION_KEY_STORAGE);
  if (existing) return existing;

  const nextKey =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_SESSION_KEY_STORAGE, nextKey);
  return nextKey;
}

export const trackVisitorHeartbeat = (payload) =>
  apiClient.post("/analytics/visitor-heartbeat", payload).then((r) => r.data);
