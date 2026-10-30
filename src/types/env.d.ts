// Only public values may be imported from '@env' (see the allowlist in babel.config.js).
declare module '@env' {
  export const CATALOG_API_URL: string;
  export const API_BASE_URL: string;
  export const MAPBOX_ACCESS_TOKEN: string;
}
