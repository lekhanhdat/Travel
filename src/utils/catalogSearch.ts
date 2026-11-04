import {convertCitationVietnameseUnsigned} from './Utils';
// Shared i18next instance (configured by src/i18n), see translationHelpers.
import i18n from 'i18next';

/** Lowercase, accent-free text for matching; arrays (e.g. `types`) are joined, `_`/`-` become spaces. */
export function normalizeSearchText(value: unknown): string {
  const text = Array.isArray(value) ? value.join(' ') : value === null || value === undefined ? '' : String(value);
  return (convertCitationVietnameseUnsigned(text) ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** P11.5: Vietnamese + English labels of `types` slugs (common.json `types`), so "bảo tàng" finds `museum`. */
export function typeLabels(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) {return [];}
  return slugs.flatMap(slug => ['vi', 'en']
    .filter(lng => i18n.exists(`common:types.${slug}`, {lng}))
    .map(lng => String(i18n.t(`common:types.${slug}`, {lng}))));
}

/** Local catalog search: every query word must appear in one of `fields` (accent-insensitive). */
export function searchCatalog<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  if (words.length === 0) {return items;}
  return items.filter(item => {
    const haystack = fields.map(field => normalizeSearchText(
      field === 'types' ? [...((item[field] as unknown as string[]) ?? []), ...typeLabels(item[field])] : item[field],
    )).join(' ');
    return words.every(word => haystack.includes(word));
  });
}

export const LOCATION_SEARCH_FIELDS = ['name', 'description', 'types', 'address'] as const;
export const FESTIVAL_SEARCH_FIELDS = ['name', 'description', 'types', 'location'] as const;
