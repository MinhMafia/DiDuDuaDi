export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function getLocalizedValue(value, language, fallbackLanguage = "vi") {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";

  return value[language] || value[fallbackLanguage] || Object.values(value)[0] || "";
}

export function resolveBackendUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  if (/^(https?:|blob:|data:)/i.test(pathOrUrl)) return pathOrUrl;

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  const shouldUseLocalProxyByDefault =
    import.meta.env.DEV && import.meta.env.VITE_FORCE_REMOTE_API !== "true";

  if (shouldUseLocalProxyByDefault) {
    return normalizedPath;
  }

  const configuredBaseUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (!configuredBaseUrl) {
    return normalizedPath;
  }

  const backendOrigin = configuredBaseUrl
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  return `${backendOrigin}${normalizedPath}`;
}

export function calculateDistanceMeters(from, to) {
  if (!from || !to) return null;

  const earthRadius = 6371000;
  const dLat = degreesToRadians(to.lat - from.lat);
  const dLng = degreesToRadians(to.lng - from.lng);
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
