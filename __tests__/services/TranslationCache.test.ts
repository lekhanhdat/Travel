/**
 * Unit tests for TranslationCache (Memory Cache)
 */

import {TranslationMemoryCache} from '../../src/services/translation/TranslationCache';

describe('TranslationMemoryCache', () => {
  let cache: TranslationMemoryCache;

  beforeEach(() => {
    cache = new TranslationMemoryCache(100, 60);
  });

  describe('set and get', () => {
    it('should store and retrieve translations', () => {
      cache.set('Hello', 'vi', 'Xin chào', 'en');
      const result = cache.get('Hello', 'vi', 'en');
      expect(result).toBe('Xin chào');
    });

    it('should return null for missing translations', () => {
      const result = cache.get('Missing', 'vi', 'en');
      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing translations', () => {
      cache.set('Hello', 'vi', 'Xin chào', 'en');
      expect(cache.has('Hello', 'vi', 'en')).toBe(true);
    });

    it('should return false for missing translations', () => {
      expect(cache.has('Missing', 'vi', 'en')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cached translations', () => {
      cache.set('Hello', 'vi', 'Xin chào', 'en');
      cache.set('Goodbye', 'vi', 'Tạm biệt', 'en');
      cache.clear();
      expect(cache.get('Hello', 'vi', 'en')).toBeNull();
      expect(cache.get('Goodbye', 'vi', 'en')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('Hello', 'vi', 'Xin chào', 'en');
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entries when at capacity', () => {
      const smallCache = new TranslationMemoryCache(2, 60);
      smallCache.set('First', 'vi', 'Đầu tiên', 'en');
      smallCache.set('Second', 'vi', 'Thứ hai', 'en');
      smallCache.set('Third', 'vi', 'Thứ ba', 'en');
      
      expect(smallCache.get('First', 'vi', 'en')).toBeNull();
      expect(smallCache.get('Second', 'vi', 'en')).toBe('Thứ hai');
      expect(smallCache.get('Third', 'vi', 'en')).toBe('Thứ ba');
    });
  });
});

