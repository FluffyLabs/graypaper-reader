import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "tools/**/*"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
