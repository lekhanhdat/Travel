import Geolocation, {GeolocationResponse} from '@react-native-community/geolocation';

// One accurate fix for Home "Gần bạn" and the map.
// - enableHighAccuracy: false maps to PRIORITY_LOW_POWER in @react-native-community/geolocation 3.4
//   (Play Services), i.e. city-level positions; always ask for high accuracy.
// - getCurrentPosition is avoided: its Play Services callback is a shared field and a second result
//   calls removeLocationUpdates(null), which crashes the app ("Listener must not be null").
//   watchPosition keeps its own callback, so the first fixes are collected here and the best one wins.
const GOOD_ACCURACY_M = 20;
const MAX_WAIT_MS = 10000;

export interface PreciseLocationError {
  code: number; // 1 permission denied, 2 unavailable, 3 timeout
  message: string;
}

export function getPreciseLocation(maxWaitMs = MAX_WAIT_MS): Promise<GeolocationResponse> {
  return new Promise((resolve, reject) => {
    let best: GeolocationResponse | null = null;
    let done = false;
    let watchId: number | null = null;

    const finish = (error?: PreciseLocationError) => {
      if (done) {return;}
      done = true;
      clearTimeout(timer);
      if (watchId !== null) {Geolocation.clearWatch(watchId);}
      if (best) {
        resolve(best);
      } else {
        reject(error ?? {code: 3, message: 'Location timeout'});
      }
    };

    const timer = setTimeout(() => finish(), maxWaitMs);
    watchId = Geolocation.watchPosition(
      position => {
        if (!best || position.coords.accuracy < best.coords.accuracy) {best = position;}
        if (position.coords.accuracy <= GOOD_ACCURACY_M) {finish();}
      },
      error => {
        // Permission denied ends at once; other errors wait for a later fix until the timer.
        if (error.code === 1) {finish({code: 1, message: error.message});}
      },
      {enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 500, maximumAge: 0},
    );
    // A fix delivered synchronously finished before watchId existed.
    if (done) {Geolocation.clearWatch(watchId);}
  });
}
