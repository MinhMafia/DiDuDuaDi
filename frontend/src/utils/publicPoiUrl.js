const QR_BASE_URL_STORAGE_KEY = "didududadi.qrBaseUrl";
const DEFAULT_PUBLIC_APP_URL = "https://di-du-dua-di.vercel.app";

function isPrivateOrLocalBaseUrl(baseUrl) {
  const normalizedBaseUrl = normalizePublicBaseUrl(baseUrl);
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\./i.test(
    normalizedBaseUrl,
  );
}

export function normalizePublicBaseUrl(value) {
  if (!value) return "";

  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getInitialPublicBaseUrl() {
  const configuredBaseUrl = normalizePublicBaseUrl(import.meta.env.VITE_PUBLIC_APP_URL);

  if (typeof window === "undefined") {
    return configuredBaseUrl || DEFAULT_PUBLIC_APP_URL;
  }

  const runtimeBaseUrl = normalizePublicBaseUrl(window.location.origin);

  const storedBaseUrl = normalizePublicBaseUrl(
    window.localStorage.getItem(QR_BASE_URL_STORAGE_KEY),
  );

  if (runtimeBaseUrl && !isPrivateOrLocalBaseUrl(runtimeBaseUrl)) {
    return runtimeBaseUrl;
  }

  if (configuredBaseUrl && !isPrivateOrLocalBaseUrl(configuredBaseUrl)) {
    return configuredBaseUrl;
  }

  if (storedBaseUrl && !isPrivateOrLocalBaseUrl(storedBaseUrl)) {
    return storedBaseUrl;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function persistPublicBaseUrl(value) {
  if (typeof window === "undefined") return;

  const normalizedValue = normalizePublicBaseUrl(value);
  if (!normalizedValue) {
    window.localStorage.removeItem(QR_BASE_URL_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(QR_BASE_URL_STORAGE_KEY, normalizedValue);
}

export function buildPoiDetailUrl(poiId, baseUrl) {
  const normalizedBaseUrl = normalizePublicBaseUrl(baseUrl);
  if (!poiId || !normalizedBaseUrl) return "";
  return `${normalizedBaseUrl}/poi/${poiId}`;
}

export function isLocalBaseUrl(baseUrl) {
  return isPrivateOrLocalBaseUrl(baseUrl);
}
