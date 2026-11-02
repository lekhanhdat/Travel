import {TFunction} from 'i18next';

// The shared i18next instance (configured by src/i18n); importing the config here would pull react-i18next.
import i18n from 'i18next';

// Catalog content comes only from the API. The old per-ID translation files keyed records by
// legacy NocoDB IDs and overwrote API names (e.g. id 1), so these helpers never look up i18n keys.
// P11 (D1): in English, a record's `content_en` (Neon, translated once by script) replaces the
// Vietnamese value field by field; untranslated fields (or ids passed by older callers) keep `fallback`.
type EnglishContent = Record<string, string | string[]>;
type CatalogRecordRef = {content_en?: EnglishContent} | string | number | null | undefined;

export function englishValue(record: CatalogRecordRef, field: string, index?: number): string | undefined {
  if (!(i18n.language || '').startsWith('en') || !record || typeof record !== 'object') {return undefined;}
  const value = record.content_en?.[field];
  if (Array.isArray(value)) {
    const item = index === undefined ? undefined : value[index];
    return typeof item === 'string' && item.trim() ? item : undefined;
  }
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function translateLocationField(
  _t: TFunction,
  record: CatalogRecordRef,
  field: 'name' | 'description' | 'long_description' | 'address' | 'opening_hours' | 'ticket_info' | 'advise',
  fallback: string,
  index?: number,
): string {
  return englishValue(record, field, index) ?? fallback;
}

export function translateFestivalField(
  _t: TFunction,
  record: CatalogRecordRef,
  field: 'name' | 'description' | 'long_description' | 'location' | 'event_time' | 'ticket_info' | 'advise',
  fallback: string,
  index?: number,
): string {
  return englishValue(record, field, index) ?? fallback;
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
