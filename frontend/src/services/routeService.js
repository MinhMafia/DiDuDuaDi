export async function getDrivingRoute(from, to) {
  if (!from || !to) {
    throw new Error("Missing route points");
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to fetch route");
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (!route || !Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("No route found");
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: coordinates.map(([lng, lat]) => ({ lat, lng })),
  };
}