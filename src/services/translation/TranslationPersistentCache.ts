/**
 * Persistent cache for translations using AsyncStorage
 * Provides offline support and persistence across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@translation_cache:';
const CACHE_INDEX_KEY = '@translation_cache_index';

interface CacheEntry {
  value: string;
  timestamp: number;
}

export class TranslationPersistentCache {
  private ttl: number; // Time to live in milliseconds

  constructor(ttlDays: number = 7) {
    this.ttl = ttlDays * 24 * 60 * 60 * 1000;
  }

  private generateKey(text: string, targetLang: string, sourceLang: string): string {
    return `${CACHE_PREFIX}${sourceLang}:${targetLang}:${text}`;
  }

  async get(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string | null> {
    try {
      const key = this.generateKey(text, targetLang, sourceLang);
      const data = await AsyncStorage.getItem(key);

      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);

      // Check if expired
      if (Date.now() - entry.timestamp > this.ttl) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Persistent cache get error:', error);
      return null;
    }
  }

  async set(
    text: string,
    targetLang: string,
    translation: string,
    sourceLang: string = 'en',
  ): Promise<void> {
    try {
      const key = this.generateKey(text, targetLang, sourceLang);
      const entry: CacheEntry = {
        value: translation,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Persistent cache set error:', error);
    }
  }

  async setBatch(
    translations: Array<{
      text: string;
      targetLang: string;
      translation: string;
      sourceLang?: string;
    }>,
  ): Promise<void> {
    try {
      const pairs: [string, string][] = translations.map(item => {
        const key = this.generateKey(item.text, item.targetLang, item.sourceLang || 'en');
        const entry: CacheEntry = {
          value: item.translation,
          timestamp: Date.now(),
        };
        return [key, JSON.stringify(entry)];
      });
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Persistent cache setBatch error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Persistent cache clear error:', error);
    }
  }

  async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(CACHE_PREFIX)).length;
    } catch (error) {
      return 0;
    }
  }
}

export const translationPersistentCache = new TranslationPersistentCache();
export default translationPersistentCache;

