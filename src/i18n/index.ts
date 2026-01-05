/**
 * i18n Configuration for React Native Travel App
 * 
 * This module configures react-i18next for internationalization.
 * Supports English (en) and Vietnamese (vi) languages.
 */

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enLocations from './locales/en/locations.json';
import viLocations from './locales/vi/locations.json';
import enFestivals from './locales/en/festivals.json';
import viFestivals from './locales/vi/festivals.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Define namespaces
export const NAMESPACES = ['common', 'locations', 'festivals'] as const;
export type Namespace = (typeof NAMESPACES)[number];

// Default namespace
export const DEFAULT_NAMESPACE: Namespace = 'common';

// Fallback language
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

// Resources configuration
const resources = {
  en: {
    common: enCommon,
    locations: enLocations,
    festivals: enFestivals,
  },
  vi: {
    common: viCommon,
    locations: viLocations,
    festivals: viFestivals,
  },
};

// Initialize i18next
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: FALLBACK_LANGUAGE, // Default language
    fallbackLng: FALLBACK_LANGUAGE,
    
    // Namespaces configuration
    ns: NAMESPACES as unknown as string[],
    defaultNS: DEFAULT_NAMESPACE,
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React Native specific settings
    compatibilityJSON: 'v4', // For React Native compatibility
    
    // Debug mode (disable in production)
    debug: __DEV__,
    
    // Key separator for nested keys (e.g., 'navigation.home')
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Return empty string for missing keys in production
    returnEmptyString: false,
    returnNull: false,
    
    // React specific options
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Change the current language
 * @param language - The language code to switch to
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  if (SUPPORTED_LANGUAGES.includes(language)) {
    await i18n.changeLanguage(language);
  } else {
    console.warn(`Language "${language}" is not supported. Falling back to "${FALLBACK_LANGUAGE}".`);
    await i18n.changeLanguage(FALLBACK_LANGUAGE);
  }
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

/**
 * Check if a language is supported
 */
export const isLanguageSupported = (language: string): language is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
};

export default i18n;
