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
  const response = await apiClient.post("/auth/owner-upgrade-request", payload);
  return response.data;
}
