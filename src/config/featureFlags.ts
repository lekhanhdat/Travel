/** Phase 1: guest catalog shell. Re-enable integrations only in their recovery phase. */
export const FEATURE_FLAGS = {
  RECOVERY_MODE: true,
  ENABLE_AUTH: true,
  ENABLE_NOCODB: false,
  ENABLE_AI: true,
  ENABLE_MAP: true,
  ENABLE_PAYMENT: false,
  ENABLE_UPLOAD: true,
  ENABLE_ITEMS: false,
  ENABLE_FEED: true,
  ENABLE_CAMERA: true,
  USE_AZURE_TRANSLATOR: false,
  ENABLE_OFFLINE_CACHE: false,
  ENABLE_TRANSLATION_BATCHING: false,
};
export default FEATURE_FLAGS;
