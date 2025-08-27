import { useEffect, useState } from "react";
import { type FeatureFlagKey, isFeatureEnabled } from "./featureFlags";

export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flagKey));

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea === sessionStorage && e.key?.startsWith("gp_feature_flag_")) {
        setEnabled(isFeatureEnabled(flagKey));
      }
    };

    const checkFlagState = () => {
      const currentState = isFeatureEnabled(flagKey);
      if (currentState !== enabled) {
        setEnabled(currentState);
      }
    };

    const intervalId = setInterval(checkFlagState, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [flagKey, enabled]);

  return enabled;
}

export function withFeatureFlag<P extends object>(
  flagKey: FeatureFlagKey,
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function FeatureFlagWrapper(props: P) {
    const isEnabled = useFeatureFlag(flagKey);

    if (!isEnabled) {
      return null;
    }

    return <Component {...props} />;
  };
}
