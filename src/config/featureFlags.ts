/** Phase 1: guest catalog shell. Re-enable integrations only in their recovery phase. */
export const FEATURE_FLAGS = {
  ENABLE_AUTH: true,
  ENABLE_AI: true,
  ENABLE_MAP: true,
  ENABLE_PAYMENT: false,
  ENABLE_UPLOAD: true,
  ENABLE_FEED: true,
  ENABLE_CAMERA: true,
};
export default FEATURE_FLAGS;
