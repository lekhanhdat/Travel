// Missing publication flags remain hidden, including legacy API records.
export const parsePublishable = (value: unknown): boolean =>
  value === true || value === 1 || value === 'true' || value === '1';

export const isMapLocationVisible = (location: {
  publishable?: boolean;
  lat?: number | null;
  long?: number | null;
}): boolean =>
  location.publishable === true &&
  typeof location.lat === 'number' && Number.isFinite(location.lat) &&
  typeof location.long === 'number' && Number.isFinite(location.long) &&
  location.lat >= -90 && location.lat <= 90 &&
  location.long >= -180 && location.long <= 180;
