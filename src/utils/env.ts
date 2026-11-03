/**
 * Environment configuration loader
 * Reads from .env file using react-native-dotenv
 *
 * Note: After changing .env, you need to:
 * 1. Clear Metro cache: npx react-native start --reset-cache
 * 2. Rebuild the app
 *
 * Only public values are read from .env (babel.config.js allowlist), because every
 * imported value is inlined into the JS bundle. Paid-service keys live in Secret
 * Manager and are used by the backend only.
 */

import {
  MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_ACCESS_TOKEN,
  API_BASE_URL as ENV_API_BASE_URL,
} from '@env';

// Same Cloud Run service as CATALOG_API_URL (catalog.client.ts).
const DEFAULT_API_BASE_URL = 'https://travel-api-u2xcse44ca-as.a.run.app';

export type AppEnv = {
  API_BASE_URL: string;
  MAPBOX_ACCESS_TOKEN: string;
};

export const env: AppEnv = {
  API_BASE_URL: (ENV_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ''),
  MAPBOX_ACCESS_TOKEN: ENV_MAPBOX_ACCESS_TOKEN || '',
};
