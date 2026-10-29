import {TFunction} from 'i18next';

// Catalog content comes only from the API. The old per-ID translation files keyed records by
// legacy NocoDB IDs and overwrote API names (e.g. id 1), so these helpers return the API value.
// Signatures are kept so call sites can be removed gradually.
export function translateLocationField(
  _t: TFunction,
  _locationId: string | number,
  _field: 'name' | 'description' | 'address' | 'advise',
  fallback: string,
  _index?: number,
): string {
  return fallback;
}

export function translateFestivalField(
  _t: TFunction,
  _festivalId: string | number,
  _field: 'name' | 'description' | 'location' | 'event_time' | 'ticket_info' | 'advise',
  fallback: string,
  _index?: number,
): string {
  return fallback;
}

export function translateWithFallback(
  t: TFunction,
  key: string,
  fallback?: string,
): string {
  const defaultValue = fallback || key;
  const translated = t(key, {defaultValue});
  if (__DEV__ && translated === key) {
    console.warn(`Missing translation for key: ${key}`);
  }
  return translated;
}
