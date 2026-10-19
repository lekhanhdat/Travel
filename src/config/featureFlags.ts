/** Phase 1: guest catalog shell. Re-enable integrations only in their recovery phase. */
export const FEATURE_FLAGS = {
  RECOVERY_MODE: true,
  ENABLE_AUTH: false,
  ENABLE_NOCODB: false,
  ENABLE_AI: false,
  ENABLE_MAP: false,
  ENABLE_PAYMENT: false,
  ENABLE_UPLOAD: false,
  ENABLE_ITEMS: false,
  ENABLE_FEED: false,
  ENABLE_CAMERA: false,
  USE_AZURE_TRANSLATOR: false,
  ENABLE_OFFLINE_CACHE: false,
  ENABLE_TRANSLATION_BATCHING: false,
};
export default FEATURE_FLAGS;
