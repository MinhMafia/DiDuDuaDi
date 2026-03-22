import apiClient from "./apiClient";

export async function getBackendHealth() {
  const response = await apiClient.get("/health");
  return response.data;
}

export async function getPois() {
  const response = await apiClient.get("/pois");
  return response.data;
}

export async function getNearbyPois(lat, lng, radius = 500) {
  const response = await apiClient.get("/pois/nearby", {
    params: { lat, lng, radius },
  });
  return response.data;
}
