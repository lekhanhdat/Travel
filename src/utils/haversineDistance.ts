const toRadian = (angle: any) => (Math.PI / 180) * angle;

const haversineDistance = (coords1: any, coords2: any) => {
  const R = 6371; // Radius of the Earth in km

  const dLat = toRadian(coords2.latitude - coords1.latitude);
  const dLon = toRadian(coords2.longitude - coords1.longitude);

  const lat1 = toRadian(coords1.latitude);
  const lat2 = toRadian(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInKm = R * c; // Distance in km
  const distanceInMeters = distanceInKm * 1000; // Convert to meters

  return distanceInMeters; // Return distance in meters
};

export default haversineDistance;
