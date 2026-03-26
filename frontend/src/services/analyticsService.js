import apiClient from "./apiClient";

export async function trackPoiView(payload) {
  const response = await apiClient.post("/analytics/poi-view", payload);
  return response.data;
}

export async function trackAudioPlay(payload) {
  const response = await apiClient.post("/analytics/audio-play", payload);
  return response.data;
}
