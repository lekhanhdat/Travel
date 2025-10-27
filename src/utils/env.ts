/**
 * Environment configuration loader
 * Reads from .env file using react-native-dotenv
 *
 * Note: After changing .env, you need to:
 * 1. Clear Metro cache: npx react-native start --reset-cache
 * 2. Rebuild the app
 */

import {
  SERVER_URL as ENV_SERVER_URL,
  DB_URL as ENV_DB_URL,
  NOCODB_TOKEN as ENV_NOCODB_TOKEN,
  MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_ACCESS_TOKEN,
  PAYOS_BACKEND_URL as ENV_PAYOS_BACKEND_URL,
  SENDGRID_API_KEY as ENV_SENDGRID_API_KEY,
  PASSWORD_SALT as ENV_PASSWORD_SALT,
} from '@env';

export type AppEnv = {
  SERVER_URL: string;
  DB_URL: string;
  NOCODB_TOKEN: string;
  MAPBOX_ACCESS_TOKEN: string;
  PAYOS_BACKEND_URL: string;
  SENDGRID_API_KEY: string;
  PASSWORD_SALT: string;
};

export const env: AppEnv = {
  SERVER_URL: ENV_SERVER_URL || 'https://digital-ocean-fast-api-h9zys.ondigitalocean.app',
  DB_URL: ENV_DB_URL || 'https://app.nocodb.com',
  NOCODB_TOKEN: ENV_NOCODB_TOKEN || '',
  MAPBOX_ACCESS_TOKEN: ENV_MAPBOX_ACCESS_TOKEN || '',
  PAYOS_BACKEND_URL: ENV_PAYOS_BACKEND_URL || '',
  SENDGRID_API_KEY: ENV_SENDGRID_API_KEY || '',
  PASSWORD_SALT: ENV_PASSWORD_SALT || 'TravelApp_Secret_Salt_2025',
};

