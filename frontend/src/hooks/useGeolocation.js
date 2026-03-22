import { useEffect, useState } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return location;
}
