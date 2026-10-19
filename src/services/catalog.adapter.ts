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
  verification_status: string;
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
  location: string;
  location_id: number | null;
  start_date: string | null;
  end_date: string | null;
  schedule_status: string;
  organizer: string;
}

function validate(raw: unknown, festival: boolean): void {
  if (!raw || typeof raw !== 'object') {throw new CatalogError('contract');}
  const row = raw as Record<string, unknown>;
  const strings = ['record_id', 'name', 'description', 'long_description', 'website', 'phone',
    'ticket_info', 'verification_status', ...(festival
      ? ['event_time', 'location', 'schedule_status', 'organizer'] : ['address', 'opening_hours', 'avatar'])];
  const numbers = festival ? ['rating', 'location_id'] : ['rating', 'lat', 'long'];
  if (!Number.isSafeInteger(row.id) || typeof row.publishable !== 'boolean' ||
      strings.some(key => typeof row[key] !== 'string') ||
      numbers.some(key => row[key] !== null && (typeof row[key] !== 'number' || !Number.isFinite(row[key]))) ||
      !Array.isArray(row.reviews) ||
      ['types', 'images', 'videos', 'advise'].some(key =>
        !Array.isArray(row[key]) || (row[key] as unknown[]).some(value => typeof value !== 'string')) ||
      (festival && (['start_date', 'end_date'].some(key => row[key] !== null && typeof row[key] !== 'string') ||
        (row.location_id !== null && !Number.isSafeInteger(row.location_id))))) {
    throw new CatalogError('contract');
  }
}

export function adaptLocation(raw: unknown): LocationDTO & {Id: number} {
  validate(raw, false);
  const row = raw as LocationDTO;
  return {...row, Id: row.id};
}

export function adaptFestival(raw: unknown): FestivalDTO & {Id: number} {
  validate(raw, true);
  const row = raw as FestivalDTO;
  return {...row, Id: row.id};
}
