import axios from "axios";

function resolveApiBaseUrl() {
  const shouldUseLocalProxyByDefault =
    import.meta.env.DEV && import.meta.env.VITE_FORCE_REMOTE_API !== "true";

  if (shouldUseLocalProxyByDefault) {
    return "/api";
  }

  const configuredBaseUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (!configuredBaseUrl) {
    return "/api";
  }

  const trimmedBaseUrl = configuredBaseUrl.replace(/\/+$/, "");
  return trimmedBaseUrl.endsWith("/api") ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const requestPath = config.url ?? "";
  const isAuthRequest =
    requestPath.includes("/auth/login") || requestPath.includes("/auth/register");

  const session = window.localStorage.getItem("didududadi.session");
  if (!session || isAuthRequest) {
    return config;
  }

  try {
    const parsedSession = JSON.parse(session);
    const token = parsedSession?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore malformed local session and continue without auth header.
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.localStorage.removeItem("didududadi.session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
