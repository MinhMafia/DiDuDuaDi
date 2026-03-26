import apiClient from "./apiClient";

export async function getOwnerDashboard(username) {
  const response = await apiClient.get("/owner/dashboard", { params: { username } });
  return response.data;
}

export async function updateShopProfile(username, payload) {
  const response = await apiClient.put("/owner/shop-profile", payload, {
    params: { username },
  });
  return response.data;
}

export async function createMenuItem(username, payload) {
  const response = await apiClient.post("/owner/menu-items", payload, {
    params: { username },
  });
  return response.data;
}

export async function updateMenuItem(username, menuItemId, payload) {
  const response = await apiClient.put(`/owner/menu-items/${menuItemId}`, payload, {
    params: { username },
  });
  return response.data;
}

export async function deleteMenuItem(username, menuItemId) {
  const response = await apiClient.delete(`/owner/menu-items/${menuItemId}`, {
    params: { username },
  });
  return response.data;
}

export async function createClaimCode(username, payload) {
  const response = await apiClient.post("/owner/claim-codes", payload, {
    params: { username },
  });
  return response.data;
}
