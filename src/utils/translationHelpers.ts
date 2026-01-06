import {TFunction} from 'i18next';

export function getLocationTranslationKey(id: string | number): string {
  return `loc_${id}`;
}

export function getFestivalTranslationKey(id: string | number): string {
  return `fest_${id}`;
}

export function translateLocationField(
  t: TFunction,
  locationId: string | number,
  field: 'name' | 'description' | 'address' | 'advise',
  fallback: string,
  index?: number,
): string {
  let key = `locations:loc_${locationId}.${field}`;
  if (field === 'advise' && index !== undefined) {
    key = `locations:loc_${locationId}.advise.${index}`;
  }
  return translateWithFallback(t, key, fallback);
}

export function translateFestivalField(
  t: TFunction,
  festivalId: string | number,
  field: 'name' | 'description' | 'location' | 'event_time' | 'ticket_info' | 'advise',
  fallback: string,
  index?: number,
): string {
  let key = `festivals:fest_${festivalId}.${field}`;
  if (field === 'advise' && index !== undefined) {
    key = `festivals:fest_${festivalId}.advise.${index}`;
  }
  return translateWithFallback(t, key, fallback);
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
