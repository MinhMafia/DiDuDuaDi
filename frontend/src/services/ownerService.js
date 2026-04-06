import apiClient from "./apiClient";

export async function getOwnerDashboard() {
  const response = await apiClient.get("/owner/dashboard");
  return response.data;
}

export async function updateShopProfile(payload) {
  const response = await apiClient.put("/owner/shop-profile", payload);
  return response.data;
}

export async function createMenuItem(payload) {
  const response = await apiClient.post("/owner/menu-items", payload);
  return response.data;
}

export async function updatePoiContent(payload) {
  const response = await apiClient.put("/owner/poi-content", payload);
  return response.data;
}

export async function updateMenuItem(menuItemId, payload) {
  const response = await apiClient.put(`/owner/menu-items/${menuItemId}`, payload);
  return response.data;
}

export async function deleteMenuItem(menuItemId) {
  const response = await apiClient.delete(`/owner/menu-items/${menuItemId}`);
  return response.data;
}

export async function createClaimCode(payload) {
  const response = await apiClient.post("/owner/claim-codes", payload);
  return response.data;
}
