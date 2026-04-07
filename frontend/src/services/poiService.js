import apiClient from "./apiClient";

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

export async function getPoiById(id) {
  const response = await apiClient.get(`/pois/${id}`);
  return response.data;
}

export async function createPoi(poiData) {
  const response = await apiClient.post("/pois", poiData);
  return response.data;
}

export async function updatePoi(id, poiData) {
  const response = await apiClient.put(`/pois/${id}`, poiData);
  return response.data;
}

export async function deletePoi(id) {
  const response = await apiClient.delete(`/pois/${id}`);
  return response.data;
}
