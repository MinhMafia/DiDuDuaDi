import { useCallback, useEffect, useRef, useState } from "react";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000,
};

const PERMISSION_UNKNOWN = "unknown";
const PERMISSION_PROMPT = "prompt";
const PERMISSION_GRANTED = "granted";
const PERMISSION_DENIED = "denied";
const PERMISSION_UNSUPPORTED = "unsupported";

function getErrorCode(error) {
  if (!error) return "";
  if (error.code === 1) return "permission_denied";
  if (error.code === 2) return "position_unavailable";
  if (error.code === 3) return "timeout";
  return "unknown";
}

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState(PERMISSION_UNKNOWN);
  const watchIdRef = useRef(null);
  const permissionCleanupRef = useRef(null);
  const isSupported = typeof navigator !== "undefined" && !!navigator.geolocation;

  const clearWatch = useCallback(() => {
    if (!isSupported || watchIdRef.current === null) return;
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, [isSupported]);

  const handleSuccess = useCallback((pos) => {
    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setError("");
    setErrorCode("");
    setIsLoading(false);
    setPermissionState(PERMISSION_GRANTED);
  }, []);

  const handleError = useCallback((geoError) => {
    const nextErrorCode = getErrorCode(geoError);

    setError(geoError?.message || "Unable to get current location.");
    setErrorCode(nextErrorCode);
    setIsLoading(false);

    if (nextErrorCode === "permission_denied") {
      setLocation(null);
      setPermissionState(PERMISSION_DENIED);
    }
  }, []);

  const startWatch = useCallback(() => {
    if (!isSupported) {
      setError("Geolocation is not supported on this device.");
      setErrorCode("unsupported");
      setIsLoading(false);
      setPermissionState(PERMISSION_UNSUPPORTED);
      return null;
    }

    clearWatch();
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_OPTIONS,
    );
    return watchIdRef.current;
  }, [clearWatch, handleError, handleSuccess, isSupported]);

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError("Geolocation is not supported on this device.");
      setErrorCode("unsupported");
      setIsLoading(false);
      setPermissionState(PERMISSION_UNSUPPORTED);
      return Promise.resolve(false);
    }

    setError("");
    setErrorCode("");
    setIsLoading(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleSuccess(pos);
          startWatch();
          resolve(true);
        },
        (geoError) => {
          handleError(geoError);
          resolve(false);
        },
        GEOLOCATION_OPTIONS,
      );
    });
  }, [handleError, handleSuccess, isSupported, startWatch]);

  useEffect(() => {
    if (!isSupported) {
      setError("Geolocation is not supported on this device.");
      setErrorCode("unsupported");
      setIsLoading(false);
      setPermissionState(PERMISSION_UNSUPPORTED);
      return undefined;
    }

    let isMounted = true;

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (!isMounted) return;

          setPermissionState(status.state || PERMISSION_UNKNOWN);

          const handlePermissionChange = () => {
            if (!isMounted) return;

            setPermissionState(status.state || PERMISSION_UNKNOWN);
            if (status.state === PERMISSION_GRANTED) {
              startWatch();
            } else if (status.state === PERMISSION_DENIED) {
              setLocation(null);
              setErrorCode("permission_denied");
              setIsLoading(false);
            }
          };

          if (status.addEventListener) {
            status.addEventListener("change", handlePermissionChange);
            permissionCleanupRef.current = () =>
              status.removeEventListener("change", handlePermissionChange);
          } else {
            status.onchange = handlePermissionChange;
            permissionCleanupRef.current = () => {
              status.onchange = null;
            };
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setPermissionState(PERMISSION_UNKNOWN);
        });
    } else {
      setPermissionState(PERMISSION_PROMPT);
    }

    startWatch();

    return () => {
      isMounted = false;
      clearWatch();
      permissionCleanupRef.current?.();
      permissionCleanupRef.current = null;
    };
  }, [clearWatch, isSupported, startWatch]);

  return {
    error,
    errorCode,
    isLoading,
    isSupported,
    location,
    permissionState,
    requestLocation,
  };
}
