export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
}

export const FEATURE_FLAGS = {
  DEBUG_DRAW_BLOCKS: {
    key: "debug_draw_blocks",
    name: "Debug Draw Blocks",
    description: "Draws visual rectangles around synctex blocks for debugging",
    defaultValue: false,
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

class FeatureFlagsManager {
  private static STORAGE_PREFIX = "gp_feature_flag_";

  private isDevelopment(): boolean {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  }

  private getStorageKey(flagKey: string): string {
    return `${FeatureFlagsManager.STORAGE_PREFIX}${flagKey}`;
  }

  isEnabled(flagKey: FeatureFlagKey): boolean {
    if (!this.isDevelopment()) {
      return false;
    }

    const flag = FEATURE_FLAGS[flagKey];
    const storedValue = sessionStorage.getItem(this.getStorageKey(flag.key));

    if (storedValue !== null) {
      return storedValue === "true";
    }

    return flag.defaultValue;
  }

  toggle(flagKey: FeatureFlagKey): boolean {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return false;
    }

    const flag = FEATURE_FLAGS[flagKey];
    const currentValue = this.isEnabled(flagKey);
    const newValue = !currentValue;

    sessionStorage.setItem(this.getStorageKey(flag.key), String(newValue));

    console.log(`🚩 Feature flag "${flag.name}" is now ${newValue ? "ENABLED ✅" : "DISABLED ❌"}`);

    return newValue;
  }

  enable(flagKey: FeatureFlagKey): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    const flag = FEATURE_FLAGS[flagKey];
    sessionStorage.setItem(this.getStorageKey(flag.key), "true");
    console.log(`🚩 Feature flag "${flag.name}" is now ENABLED ✅`);
  }

  disable(flagKey: FeatureFlagKey): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    const flag = FEATURE_FLAGS[flagKey];
    sessionStorage.setItem(this.getStorageKey(flag.key), "false");
    console.log(`🚩 Feature flag "${flag.name}" is now DISABLED ❌`);
  }

  reset(flagKey: FeatureFlagKey): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    const flag = FEATURE_FLAGS[flagKey];
    sessionStorage.removeItem(this.getStorageKey(flag.key));
    console.log(`🚩 Feature flag "${flag.name}" reset to default: ${flag.defaultValue ? "ENABLED ✅" : "DISABLED ❌"}`);
  }

  resetAll(): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    for (const [, flag] of Object.entries(FEATURE_FLAGS)) {
      sessionStorage.removeItem(this.getStorageKey(flag.key));
    }

    console.log("🚩 All feature flags have been reset to defaults");
    this.listFlags();
  }

  listFlags(): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    console.group("🚩 Available Feature Flags");

    for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
      const isEnabled = this.isEnabled(key as FeatureFlagKey);
      const status = isEnabled ? "✅ ENABLED" : "❌ DISABLED";

      console.log(
        `%c${status}%c ${flag.name} (${key})\n   ${flag.description}`,
        `color: ${isEnabled ? "green" : "gray"}; font-weight: bold`,
        "color: inherit; font-weight: normal",
      );
    }

    console.groupEnd();

    console.log("\n💡 Use window.gpDev to interact with feature flags");
  }

  help(): void {
    if (!this.isDevelopment()) {
      console.warn("Feature flags are only available in development environment");
      return;
    }

    console.group("📚 Feature Flags Help");
    console.log("%cAvailable commands:", "font-weight: bold; font-size: 14px");
    console.log("  gpDev.listFlags()           - List all available feature flags");
    console.log('  gpDev.toggle("FLAG_KEY")    - Toggle a specific flag on/off');
    console.log('  gpDev.enable("FLAG_KEY")    - Enable a specific flag');
    console.log('  gpDev.disable("FLAG_KEY")   - Disable a specific flag');
    console.log('  gpDev.reset("FLAG_KEY")     - Reset flag to default value');
    console.log("  gpDev.resetAll()            - Reset all flags to defaults");
    console.log("  gpDev.help()                - Show this help message");
    console.log("\n%cAvailable flag keys:", "font-weight: bold; font-size: 14px");

    for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
      console.log(`  "${key}" - ${flag.name}`);
    }

    console.groupEnd();
  }
}

export const featureFlags = new FeatureFlagsManager();

export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return featureFlags.isEnabled(flagKey);
}
