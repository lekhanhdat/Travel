type Point = {latitude: number; longitude: number};

/** Distance to route segments, rather than to sparse vertices, in meters. */
export function routeDeviation(point: Point, route: Point[]): number {
  const scale = Math.PI / 180 * 6371000;
  const longitudeScale = scale * Math.cos(point.latitude * Math.PI / 180);
  let nearest = Infinity;
  for (let i = 1; i < route.length; i++) {
    const ax = (route[i - 1].longitude - point.longitude) * longitudeScale;
    const ay = (route[i - 1].latitude - point.latitude) * scale;
    const bx = (route[i].longitude - point.longitude) * longitudeScale;
    const by = (route[i].latitude - point.latitude) * scale;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
    nearest = Math.min(nearest, Math.hypot(ax + fraction * dx, ay + fraction * dy));
  }
  return nearest;
}
