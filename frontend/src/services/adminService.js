import apiClient from "./apiClient";

export async function getOwnerUpgradeRequests(status = "pending") {
  const response = await apiClient.get("/auth/owner-upgrade-requests", {
    params: { status },
  });
  return response.data;
}

export async function approveOwnerUpgradeRequest(requestId) {
  const response = await apiClient.post(`/auth/owner-upgrade-requests/${requestId}/approve`);
  return response.data;
}

export async function reviewOwnerUpgradeRequest(requestId, action, reason) {
  const response = await apiClient.post(`/auth/owner-upgrade-requests/${requestId}/review`, {
    action,
    reason,
  });
  return response.data;
}

export async function getShopIntroReviews(status = "pending") {
  const response = await apiClient.get("/admin/shop-intros", {
    params: { status },
  });
  return response.data;
}

export async function reviewShopIntro(shopId, action, reason) {
  const response = await apiClient.post(`/admin/shop-intros/${shopId}/review`, { action, reason });
  return response.data;
}
