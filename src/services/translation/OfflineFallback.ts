/**
 * Offline Fallback System
 * Pre-caches essential UI translations for offline use
 */

import {translationPersistentCache} from './TranslationPersistentCache';
import {translationMemoryCache} from './TranslationCache';
import {azureTranslator} from './AzureTranslatorService';

// Essential UI strings that must work offline
export const ESSENTIAL_TRANSLATIONS = [
  // Common
  'Back', 'Save', 'Cancel', 'Success', 'Error', 'Loading...', 'Search',
  'View All', 'Close', 'Confirm', 'Delete', 'Edit', 'Add', 'Update',
  'Select', 'Done', 'Retry', 'Refresh',
  // Navigation
  'Home', 'Feed', 'Map', 'Camera', 'Profile',
  // Profile
  'Settings', 'FAQ', 'Privacy & Policy', 'About App', 'Logout',
  // Settings
  'Notifications', 'Dark Mode', 'Language', 'Clear Cache',
  // Common actions
  'Yes', 'No', 'OK', 'Submit', 'Continue', 'Skip',
];

class OfflineFallbackSystem {
  private initialized = false;

  async initialize(targetLang: string = 'vi'): Promise<void> {
    if (this.initialized || targetLang === 'en') return;

    try {
      console.log('Initializing offline fallback translations...');
      
      // Check which translations are missing
      const missing: string[] = [];
      for (const text of ESSENTIAL_TRANSLATIONS) {
        const cached = await translationPersistentCache.get(text, targetLang, 'en');
        if (!cached) {
          missing.push(text);
        } else {
          // Load into memory cache
          translationMemoryCache.set(text, targetLang, cached, 'en');
        }
      }

      if (missing.length > 0) {
        console.log(`Fetching ${missing.length} missing translations...`);
        const translations = await azureTranslator.translateBatch(
          missing,
          targetLang,
          'en',
        );

        // Cache all translations
        const cacheItems = missing.map((text, i) => ({
          text,
          targetLang,
          translation: translations[i] || text,
          sourceLang: 'en',
        }));

        await translationPersistentCache.setBatch(cacheItems);
        
        // Also set in memory cache
        cacheItems.forEach(item => {
          translationMemoryCache.set(item.text, targetLang, item.translation, 'en');
        });
      }

      this.initialized = true;
      console.log('Offline fallback initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline fallback:', error);
    }
  }

  async preloadForLanguage(targetLang: string): Promise<void> {
    this.initialized = false;
    await this.initialize(targetLang);
  }
}

export const offlineFallback = new OfflineFallbackSystem();
export default offlineFallback;

