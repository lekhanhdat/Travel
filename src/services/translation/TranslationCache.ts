/**
 * LRU (Least Recently Used) Cache for translations
 * Provides fast in-memory caching with automatic eviction
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class TranslationMemoryCache {
  private cache: Map<string, CacheEntry<string>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttlMinutes: number = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate cache key from text and language pair
   */
  private generateKey(text: string, targetLang: string, sourceLang: string): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  /**
   * Get translation from cache
   */
  get(text: string, targetLang: string, sourceLang: string = 'en'): string | null {
    const key = this.generateKey(text, targetLang, sourceLang);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set translation in cache
   */
  set(text: string, targetLang: string, translation: string, sourceLang: string = 'en'): void {
    const key = this.generateKey(text, targetLang, sourceLang);

    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value: translation,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if translation exists in cache
   */
  has(text: string, targetLang: string, sourceLang: string = 'en'): boolean {
    return this.get(text, targetLang, sourceLang) !== null;
  }

  /**
   * Clear all cached translations
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {size: number; maxSize: number} {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
export const translationMemoryCache = new TranslationMemoryCache();
export default translationMemoryCache;

