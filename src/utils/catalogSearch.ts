import {convertCitationVietnameseUnsigned} from './Utils';

/** Lowercase, accent-free text for matching; arrays (e.g. `types`) are joined, `_`/`-` become spaces. */
export function normalizeSearchText(value: unknown): string {
  const text = Array.isArray(value) ? value.join(' ') : value === null || value === undefined ? '' : String(value);
  return (convertCitationVietnameseUnsigned(text) ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Local catalog search: every query word must appear in one of `fields` (accent-insensitive). */
export function searchCatalog<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  if (words.length === 0) {return items;}
  return items.filter(item => {
    const haystack = fields.map(field => normalizeSearchText(item[field])).join(' ');
    return words.every(word => haystack.includes(word));
  });
}

export const LOCATION_SEARCH_FIELDS = ['name', 'description', 'types', 'address'] as const;
export const FESTIVAL_SEARCH_FIELDS = ['name', 'description', 'types', 'location'] as const;
