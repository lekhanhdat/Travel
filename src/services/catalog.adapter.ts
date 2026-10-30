import {CatalogError} from './catalog.client';

export interface CatalogDTO {
  id: number;
  record_id: string;
  name: string;
  types: string[];
  description: string;
  long_description: string;
  rating: number | null;
  reviews: any[];
  images: string[];
  videos: string[];
  advise: string[];
  website: string;
  phone: string;
  ticket_info: string;
  publishable: boolean;
}

export interface LocationDTO extends CatalogDTO {
  address: string;
  lat: number | null;
  long: number | null;
  opening_hours: string;
  avatar: string;
}

export interface FestivalDTO extends CatalogDTO {
  event_time: string;
  location_id: number | null;
}

// Fields dropped by BE schema 002–006; seeing one means the API and app disagree on the contract.
export const REMOVED_FIELDS = ['verification_status', 'marker', 'metadata', 'amenities', 'price_level',
  'operational_status', 'location', 'start_date', 'end_date', 'schedule_status', 'organizer'];

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
      !Array.isArray(row.reviews) ||
      ['types', 'images', 'videos', 'advise'].some(key =>
        !Array.isArray(row[key]) || (row[key] as unknown[]).some(value => typeof value !== 'string')) ||
      (festival && row.location_id !== null && !Number.isSafeInteger(row.location_id))) {
    throw new CatalogError('contract');
  }
}

export function adaptLocation(raw: unknown): LocationDTO {
  validate(raw, false);
  return {...(raw as LocationDTO)};
}

export function adaptFestival(raw: unknown): FestivalDTO {
  validate(raw, true);
  return {...(raw as FestivalDTO)};
}
