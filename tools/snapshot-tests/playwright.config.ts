import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",

    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: "light-mode",
      use: {
        colorScheme: "light",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "dark-mode",
      use: {
        colorScheme: "dark",
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
