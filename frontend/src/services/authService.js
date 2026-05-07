import apiClient from "./apiClient";

export async function login(username, password) {
  const response = await apiClient.post("/auth/login", {
    username,
    password,
  });

  return response.data;
}

export async function register(payload) {
  const response = await apiClient.post("/auth/register", payload);
  return response.data;
}

export async function createOwnerUpgradeRequest(payload) {
  const response = await apiClient.post("/auth/owner-upgrade-request", normalizeOwnerUpgradePayload(payload));
  return response.data;
}

export async function updateOwnerUpgradeRequest(requestId, payload) {
  const response = await apiClient.put(
    `/auth/my-owner-upgrade-requests/${requestId}`,
    normalizeOwnerUpgradePayload(payload),
  );
  return response.data;
}

export async function cancelOwnerUpgradeRequest(requestId) {
  const response = await apiClient.post(`/auth/my-owner-upgrade-requests/${requestId}/cancel`);
  return response.data;
}

function normalizeOwnerUpgradePayload(payload) {
  return {
    ...payload,
    latitude:
      payload.latitude === "" || payload.latitude === null || payload.latitude === undefined
        ? null
        : Number(payload.latitude),
    longitude:
      payload.longitude === "" || payload.longitude === null || payload.longitude === undefined
        ? null
        : Number(payload.longitude),
  };
}

export async function getMyOwnerUpgradeRequest() {
  const response = await apiClient.get("/auth/my-owner-upgrade-request");
  return response.data;
}

export async function getMyOwnerUpgradeRequests() {
  const response = await apiClient.get("/auth/my-owner-upgrade-requests");
  return response.data;
}
