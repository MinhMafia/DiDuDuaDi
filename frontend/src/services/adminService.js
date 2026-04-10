import apiClient from "./apiClient";

// ================= OWNER REQUEST =================
export async function getOwnerUpgradeRequests(status = "pending") {
  const response = await apiClient.get("/auth/owner-upgrade-requests", {
    params: { status },
  });
  return response.data;
}

// approve shortcut (optional)
export async function approveOwnerUpgradeRequest(requestId) {
  const response = await apiClient.post(
    `/auth/owner-upgrade-requests/${requestId}/approve`
  );
  return response.data;
}

// review (main)
export async function reviewOwnerUpgradeRequest(
  requestId,
  action,
  reason
) {
  const response = await apiClient.post(
    `/auth/owner-upgrade-requests/${requestId}/review`,
    {
      action,
      reason,
    }
  );
  return response.data;
}

// ================= SHOP INTRO =================
export async function getShopIntroReviews(status = "pending") {
  const response = await apiClient.get("/admin/shop-intros", {
    params: { status },
  });
  return response.data;
}

export async function reviewShopIntro(shopId, action, reason) {
  const response = await apiClient.post(
    `/admin/shop-intros/${shopId}/review`,
    {
      action,
      reason,
    }
  );
  return response.data;
}

// ================= DASHBOARD =================
export async function getDashboardStats() {
  const response = await apiClient.get("/admin/dashboard-stats");
  return response.data;
}

// ================= POI MANAGEMENT =================
// 👉 FIX lỗi getPois ở đây
export async function getPois() {
  const response = await apiClient.get("/admin/pois");
  return response.data;
}

export async function createPoi(data) {
  const response = await apiClient.post("/admin/pois", data);
  return response.data;
}

export async function updatePoi(id, data) {
  const response = await apiClient.put(`/admin/pois/${id}`, data);
  return response.data;
}

export async function deletePoi(id) {
  const response = await apiClient.delete(`/admin/pois/${id}`);
  return response.data;
}

// ================= STATISTICS =================
export async function getTopPois() {
  const response = await apiClient.get("/admin/top-pois");
  return response.data;
}

// ================= TRACKING =================
export const trackPoiView = (poiId) =>
  apiClient.post("/tracking/view", { poiId });

export const trackSearch = (keyword) =>
  apiClient.post("/tracking/search", { keyword });

export const trackAudio = (poiId) =>
  apiClient.post("/tracking/audio", { poiId });
// ================= SHOP STATISTICS =================
export async function getShopStatistics() {
  const response = await apiClient.get("/admin/shop-statistics");
  return response.data;
}
// ================= TOGGLE POI STATUS =================
export async function togglePoi(id) {
  const response = await apiClient.patch(`/admin/pois/${id}/toggle`);
  return response.data;
}