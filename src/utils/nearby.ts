import haversineDistance from './haversineDistance';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const isValidGps = (lat: unknown, long: unknown): lat is number =>
  typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
  typeof long === 'number' && Number.isFinite(long) && long >= -180 && long <= 180;

/** Records with valid GPS, nearest first, each with its distance in km. Records without GPS are skipped. */
export function sortByDistance<T extends {lat: number | null; long: number | null}>(
  items: T[], origin: Coordinates, limit = 20,
): Array<T & {distanceKm: number}> {
  return items
    .filter(item => isValidGps(item.lat, item.long))
    .map(item => ({
      ...item,
      distanceKm: haversineDistance(origin, {latitude: item.lat, longitude: item.long}) / 1000,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** "850 m" under 1 km, otherwise "1.2 km" / "12 km". */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {return `${Math.round(distanceKm * 1000)} m`;}
  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km`;
}
