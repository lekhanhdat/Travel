import {CatalogError} from './catalog.client';

export interface CatalogDTO {
  id: number;
  record_id: string;
  name: string;
  types: string[];
  description: string;
  long_description: string;
  rating: number | null;
  /** P7: visible reviews in the BE table; `rating` is their average. 0 when an older API omits it. */
  review_count: number;
  images: string[];
  videos: string[];
  advise: string[];
  website: string;
  phone: string;
  ticket_info: string;
  publishable: boolean;
  /** P11 (D1): English values by field name; {} until translated (and when an older API omits it). */
  content_en: Record<string, string | string[]>;
}

export interface LocationDTO extends CatalogDTO {
  address: string;
  lat: number | null;
  long: number | null;
  opening_hours: string;
  avatar: string;
}

/** P11.4: hotels (also resorts, restaurants, cafés, bars) — a Location with a category; ids are their own
 * (they collide with location ids), so `kind` keeps them apart from locations in search and Detail. */
export interface HotelDTO extends LocationDTO {
  category: string | null;
  kind: 'hotel';
}

export interface FestivalDTO extends CatalogDTO {
  event_time: string;
  location_id: number | null;
}

// Fields dropped by BE schema 002–006; seeing one means the API and app disagree on the contract.
export const REMOVED_FIELDS = ['verification_status', 'marker', 'metadata', 'amenities', 'price_level',
  'operational_status', 'location', 'start_date', 'end_date', 'schedule_status', 'organizer'];

function isEnglishContent(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(item =>
    typeof item === 'string' || (Array.isArray(item) && item.every(entry => typeof entry === 'string')));
}

function validate(raw: unknown, festival: boolean): void {
  if (!raw || typeof raw !== 'object') {throw new CatalogError('contract');}
  const row = raw as Record<string, unknown>;
  if (REMOVED_FIELDS.some(key => key in row)) {throw new CatalogError('contract');}
  const strings = ['record_id', 'name', 'description', 'long_description', 'website', 'phone',
    'ticket_info', ...(festival
      ? ['event_time'] : ['address', 'opening_hours', 'avatar'])];
  const numbers = festival ? ['rating', 'location_id'] : ['rating', 'lat', 'long'];
  if (!Number.isSafeInteger(row.id) || typeof row.publishable !== 'boolean' ||
      strings.some(key => typeof row[key] !== 'string') ||
      numbers.some(key => row[key] !== null && (typeof row[key] !== 'number' || !Number.isFinite(row[key]))) ||
      (row.review_count !== undefined && (!Number.isSafeInteger(row.review_count) || (row.review_count as number) < 0)) ||
      (row.content_en !== undefined && !isEnglishContent(row.content_en)) ||
      ['types', 'images', 'videos', 'advise'].some(key =>
        !Array.isArray(row[key]) || (row[key] as unknown[]).some(value => typeof value !== 'string')) ||
      (festival && row.location_id !== null && !Number.isSafeInteger(row.location_id))) {
    throw new CatalogError('contract');
  }
}

export function adaptLocation(raw: unknown): LocationDTO {
  validate(raw, false);
  const row = raw as LocationDTO;
  return {...row, review_count: row.review_count ?? 0, content_en: row.content_en ?? {}};
}

export function adaptHotel(raw: unknown): HotelDTO {
  validate(raw, false);
  const row = raw as HotelDTO;
  if (row.category !== null && typeof row.category !== 'string') {throw new CatalogError('contract');}
  return {...row, review_count: row.review_count ?? 0, content_en: row.content_en ?? {}, kind: 'hotel'};
}

export function adaptFestival(raw: unknown): FestivalDTO {
  validate(raw, true);
  const row = raw as FestivalDTO;
  return {...row, review_count: row.review_count ?? 0, content_en: row.content_en ?? {}};
}
