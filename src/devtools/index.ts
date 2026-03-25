export type { FeatureFlag, FeatureFlagKey } from "./featureFlags";
export { FEATURE_FLAGS, featureFlags, isFeatureEnabled } from "./featureFlags";
export { initDevTools } from "./initDevTools";
export { useFeatureFlag, withFeatureFlag } from "./useFeatureFlag";

export function isDevelopment(): boolean {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
