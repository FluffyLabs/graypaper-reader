import { type FeatureFlagKey, featureFlags } from "./featureFlags";

declare global {
  interface Window {
    gpDev: {
      listFlags: () => void;
      toggle: (flagKey: FeatureFlagKey) => boolean;
      enable: (flagKey: FeatureFlagKey) => void;
      disable: (flagKey: FeatureFlagKey) => void;
      reset: (flagKey: FeatureFlagKey) => void;
      resetAll: () => void;
      help: () => void;
    };
  }
}

export function initDevTools(): void {
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return;
  }

  window.gpDev = {
    listFlags: () => featureFlags.listFlags(),
    toggle: (flagKey: FeatureFlagKey) => featureFlags.toggle(flagKey),
    enable: (flagKey: FeatureFlagKey) => featureFlags.enable(flagKey),
    disable: (flagKey: FeatureFlagKey) => featureFlags.disable(flagKey),
    reset: (flagKey: FeatureFlagKey) => featureFlags.reset(flagKey),
    resetAll: () => featureFlags.resetAll(),
    help: () => featureFlags.help(),
  };

  console.log(
    "%c🛠️ Graypaper Reader Dev Tools Loaded",
    "background: #4a5568; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px",
  );
  console.log(
    "💡 Type %cgpDev.help()%c to see available commands",
    "font-family: monospace; background: #edf2f7; padding: 2px 4px; border-radius: 2px",
    "",
  );
  console.log(
    "🚩 Type %cgpDev.listFlags()%c to see all feature flags",
    "font-family: monospace; background: #edf2f7; padding: 2px 4px; border-radius: 2px",
    "",
  );
}
