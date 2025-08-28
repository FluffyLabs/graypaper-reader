export { featureFlags, isFeatureEnabled, FEATURE_FLAGS } from "./featureFlags";
export type { FeatureFlag, FeatureFlagKey } from "./featureFlags";

export { useFeatureFlag, withFeatureFlag } from "./useFeatureFlag";

export { initDevTools } from "./initDevTools";

export function isDevelopment(): boolean {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
