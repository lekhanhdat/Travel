/**
 * Translation Queue for batching API requests
 * Reduces API calls by grouping multiple translation requests
 */

import {azureTranslator} from './AzureTranslatorService';
import {translationMemoryCache} from './TranslationCache';
import {translationPersistentCache} from './TranslationPersistentCache';

const MAX_BATCH_SIZE = 100;
const BATCH_DELAY_MS = 50;

interface QueueItem {
  text: string;
  targetLang: string;
  sourceLang: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

class TranslationQueue {
  private queue: Map<string, QueueItem[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private getQueueKey(targetLang: string, sourceLang: string): string {
    return `${sourceLang}:${targetLang}`;
  }

  async translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'en',
  ): Promise<string> {
    // Check memory cache first
    const memoryCached = translationMemoryCache.get(text, targetLang, sourceLang);
    if (memoryCached) return memoryCached;

    // Check persistent cache
    const persistentCached = await translationPersistentCache.get(text, targetLang, sourceLang);
    if (persistentCached) {
      translationMemoryCache.set(text, targetLang, persistentCached, sourceLang);
      return persistentCached;
    }

    // Add to queue for batching
    return this.addToQueue(text, targetLang, sourceLang);
  }

  private addToQueue(
    text: string,
    targetLang: string,
    sourceLang: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const queueKey = this.getQueueKey(targetLang, sourceLang);

      if (!this.queue.has(queueKey)) {
        this.queue.set(queueKey, []);
      }

      this.queue.get(queueKey)!.push({text, targetLang, sourceLang, resolve, reject});

      // Clear existing timer
      const existingTimer = this.timers.get(queueKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Process immediately if batch is full
      if (this.queue.get(queueKey)!.length >= MAX_BATCH_SIZE) {
        this.processQueue(queueKey);
      } else {
        // Set timer for delayed processing
        const timer = setTimeout(() => this.processQueue(queueKey), BATCH_DELAY_MS);
        this.timers.set(queueKey, timer);
      }
    });
  }

  private async processQueue(queueKey: string): Promise<void> {
    const items = this.queue.get(queueKey);
    if (!items || items.length === 0) return;

    this.queue.set(queueKey, []);
    this.timers.delete(queueKey);

    const [sourceLang, targetLang] = queueKey.split(':');
    const texts = items.map(item => item.text);

    try {
      const translations = await azureTranslator.translateBatch(texts, targetLang, sourceLang);

      // Cache and resolve all items
      const cacheItems: Array<{text: string; targetLang: string; translation: string; sourceLang: string}> = [];

      items.forEach((item, index) => {
        const translation = translations[index] || item.text;
        translationMemoryCache.set(item.text, targetLang, translation, sourceLang);
        cacheItems.push({text: item.text, targetLang, translation, sourceLang});
        item.resolve(translation);
      });

      // Batch save to persistent cache
      await translationPersistentCache.setBatch(cacheItems);
    } catch (error) {
      items.forEach(item => item.resolve(item.text)); // Fallback to original text
    }
  }
}

export const translationQueue = new TranslationQueue();
export default translationQueue;

