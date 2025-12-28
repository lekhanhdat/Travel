/**
 * Feature Flags Configuration
 * Toggle features on/off for gradual rollout and A/B testing
 */

export const FEATURE_FLAGS = {
  /**
   * Azure Translator Integration
   * When true: Uses Azure Translator API for real-time translations
   * When false: Falls back to static translations (legacy)
   */
  USE_AZURE_TRANSLATOR: true,

  /**
   * Offline Translation Cache
   * When true: Pre-caches essential translations for offline use
   */
  ENABLE_OFFLINE_CACHE: true,

  /**
   * Translation Batching
   * When true: Batches multiple translation requests to reduce API calls
   */
  ENABLE_TRANSLATION_BATCHING: true,
};

export default FEATURE_FLAGS;

