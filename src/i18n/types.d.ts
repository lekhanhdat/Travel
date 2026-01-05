/**
 * TypeScript type definitions for i18n
 * 
 * This file provides type-safe translation keys for react-i18next.
 * Module augmentation ensures the t() function has proper autocomplete.
 */

import 'react-i18next';
import type enCommon from './locales/en/common.json';

// Define the structure of translation resources
declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Default namespace
    defaultNS: 'common';
    
    // Resources type definition
    resources: {
      common: typeof enCommon;
      // Add other namespaces here as they are created
      // locations: typeof enLocations;
      // festivals: typeof enFestivals;
    };
  }
}

// Type for all translation keys in common namespace
export type CommonTranslationKeys = keyof typeof enCommon;

// Type for nested translation keys (dot notation)
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

// Flattened translation keys type
export type TranslationKey = NestedKeyOf<typeof enCommon>;

// Supported language type
export type SupportedLanguage = 'en' | 'vi';

// Namespace type
export type TranslationNamespace = 'common' | 'locations' | 'festivals';

// Translation function type
export type TFunction = (key: TranslationKey, options?: Record<string, unknown>) => string;

// Language configuration type
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// Available languages configuration
export const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
};

// Export default for module resolution
export {};
