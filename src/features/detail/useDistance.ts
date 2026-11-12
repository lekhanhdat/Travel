import {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {getPreciseLocation} from '../../utils/preciseLocation';
import haversineDistance from '../../utils/haversineDistance';

const MAX_KM = 300;

/** Distance (km) to a point — only when location permission was already granted; never prompts. */
export function useDistance(lat: number | null | undefined, long: number | null | undefined) {
  const [km, setKm] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    if (typeof lat !== 'number' || typeof long !== 'number') {return;}
    (async () => {
      if (Platform.OS === 'android') {
        const ok = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).catch(() => false);
        if (!ok) {return;}
      }
      try {
        const pos = await getPreciseLocation();
        const d = haversineDistance(pos.coords, {latitude: lat, longitude: long}) / 1000;
        // Far away (another city/country, or an emulator's default fix) → not useful, hide it.
        if (alive && d <= MAX_KM) {
          setKm(d);
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [lat, long]);
  return km;
}
