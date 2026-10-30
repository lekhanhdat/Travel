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
 * Manager and are used by the backend only; their fields stay '' here.
 */

import {
  MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_ACCESS_TOKEN,
  API_BASE_URL as ENV_API_BASE_URL,
} from '@env';

// Same Cloud Run service as CATALOG_API_URL (catalog.client.ts).
const DEFAULT_API_BASE_URL = 'https://travel-api-u2xcse44ca-as.a.run.app';

export type AppEnv = {
  API_BASE_URL: string;
  SERVER_URL: string;
  DB_URL: string;
  NOCODB_TOKEN: string;
  MAPBOX_ACCESS_TOKEN: string;
  PAYOS_BACKEND_URL: string;
  SENDGRID_API_KEY: string;
  PASSWORD_SALT: string;
  OPENAI_API_KEY: string;
  UNSPLASH_ACCESS_KEY: string;
  SERPAPI_KEY: string;
  AZURE_TRANSLATOR_KEY: string;
  AZURE_TRANSLATOR_REGION: string;
  AZURE_TRANSLATOR_ENDPOINT: string;
};

export const env: AppEnv = {
  API_BASE_URL: (ENV_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ''),
  // Legacy service defaults; callers move to API_BASE_URL in their restore phases (P6–P10).
  SERVER_URL: 'https://digital-ocean-fast-api-h9zys.ondigitalocean.app',
  DB_URL: 'https://app.nocodb.com',
  NOCODB_TOKEN: '',
  MAPBOX_ACCESS_TOKEN: ENV_MAPBOX_ACCESS_TOKEN || '',
  PAYOS_BACKEND_URL: '',
  SENDGRID_API_KEY: '',
  PASSWORD_SALT: 'TravelApp_Secret_Salt_2025',
  OPENAI_API_KEY: '',
  UNSPLASH_ACCESS_KEY: '',
  SERPAPI_KEY: '',
  AZURE_TRANSLATOR_KEY: '',
  AZURE_TRANSLATOR_REGION: 'southeastasia',
  AZURE_TRANSLATOR_ENDPOINT: 'https://api.cognitive.microsofttranslator.com',
};
