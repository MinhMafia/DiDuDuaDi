import { useEffect, useState } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isSupported = typeof navigator !== "undefined" && !!navigator.geolocation;

  useEffect(() => {
    if (!isSupported) {
      setError("Geolocation is not supported on this device.");
      setIsLoading(false);
      return undefined;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError("");
        setIsLoading(false);
      },
      (geoError) => {
        setError(geoError.message || "Unable to get current location.");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [isSupported]);

  return {
    error,
    isLoading,
    isSupported,
    location,
  };
}
