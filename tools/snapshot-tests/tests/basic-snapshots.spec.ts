import { type BrowserContext, type Page, expect, test } from "@playwright/test";
import { initialLocalStorage } from "./utils/add-notes-to-local-storage";

const port = process.env.PLAYWRIGHT_PORT || "5173";
const host = process.env.PLAYWRIGHT_HOST || "localhost";
const origin = `http://${host}:${port}`;
const hostname = `${origin}/#/ab2cdbd?v=0.7.2`;

function getCommonContext() {
  return {
    storageState: {
      cookies: [],
      origins: [
        {
          origin,
          localStorage: initialLocalStorage,
        },
      ],
    },
  };
}

test.describe
  .serial("Homepage Tests", () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext(getCommonContext());
      page = await context.newPage();
    });

    test('page title is "Gray Paper Reader"', async () => {
      await page.goto(hostname);
      await expect(page).toHaveTitle("Gray Paper Reader");
    });

    test("homepage screenshot - with outline", async () => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot("homepage-outline.png", { fullPage: true });
    });

    test.describe
      .serial("Notes Tab", () => {
        const timeout = 2_500;

        test.beforeAll(async () => {
          await page.goto(hostname, { waitUntil: "networkidle" });
          await page.evaluate(() => document.fonts.ready);
        });

        test("notes tab - initial state", async ({ browser }) => {
          await page.click('[data-testid="tab-notes"]', { timeout });
          await page.locator('[data-testid="tab-content-notes"]').waitFor({ state: "visible", timeout });
          await expect(page).toHaveScreenshot("notes-tab-initial.png", {
            // biome-ignore lint/style/noNonNullAssertion: boundingBox is expected to exist at this point
            clip: (await page.locator('[data-testid="tab-content-notes"] .note-manager').boundingBox())!,
            fullPage: false,
            animations: "disabled",
          });
        });

        test("notes tab - after note activation", async ({ browser }) => {
          await page.click('[data-testid="notes-manager-card"]', { timeout });
          await page
            .locator('[data-testid="selected-text"]')
            .filter({ hasNotText: "" })
            .waitFor({ state: "visible", timeout: timeout * 2 });
          await expect(page).toHaveScreenshot("notes-tab-after-note-activation.png", {
            // biome-ignore lint/style/noNonNullAssertion: boundingBox is guaranteed to exist at this point
            clip: (await page.locator('[data-testid="tab-content-notes"] .note-manager').boundingBox())!,
            fullPage: false,
            animations: "disabled",
          });
        });

        test("notes tab - after opening dropdown", async ({ browser }) => {
          await page.click('[data-testid="dropdown-button"]', { timeout });
          await expect(page).toHaveScreenshot("notes-tab-after-opening-dropdown.png", {
            // biome-ignore lint/style/noNonNullAssertion: boundingBox is guaranteed to exist at this point
            clip: (await page.locator('[data-testid="tab-content-notes"] .note-manager').boundingBox())!,
            fullPage: false,
            animations: "disabled",
          });
        });

        test("notes tab - after set to edit mode", async ({ browser }) => {
          await page.click('[data-testid="edit-note-button"]', { timeout });
          await expect(page).toHaveScreenshot("notes-tab-after-note-edit.png", {
            // biome-ignore lint/style/noNonNullAssertion: boundingBox is guaranteed to exist at this point
            clip: (await page.locator('[data-testid="tab-content-notes"] .note-manager').boundingBox())!,
            fullPage: false,
            animations: "disabled",
          });
        });
      });

    test.describe("Search Functionality", () => {
      test("search - initial state", async () => {
        await page.goto(hostname, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);

        // Click on search tab or search input
        const searchTab = page.locator('[data-testid="tab-search"]');

        if ((await searchTab.count()) > 0) {
          await searchTab.click();
          await page.locator('[data-testid="tab-content-search"]').waitFor({ state: "visible" });
        }

        await expect(page).toHaveScreenshot("search-initial.png", { fullPage: true });
        const searchInput = page.locator('input[placeholder*="search"]');
        await searchInput.first().fill("protocol");
        await page.locator(".search-results:not(.search-loading)").waitFor({ state: "visible" });
        await expect(page).toHaveScreenshot("search-with-query.png", { fullPage: true });
        await searchInput.first().fill("blockchain");
        await page.locator(".search-results:not(.search-loading)").waitFor({ state: "visible" });
        await expect(page).toHaveScreenshot("search-with-results.png", { fullPage: true });
      });
    });
  });

test.describe("Top Bar Tests", () => {
  test.describe("GitHub Dropdown", () => {
    test("github dropdown - expanded state", async ({ page }) => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const githubButton = page.locator(
        '[data-testid="github-dropdown"], button:has-text("GitHub"), [aria-label*="github"], .github',
      );
      if ((await githubButton.count()) > 0) {
        await githubButton.first().click();

        await expect(page).toHaveScreenshot("topbar-github-expanded.png", { fullPage: true });

        // Hover over dropdown options
        const dropdownOptions = page.locator('[role="menuitem"], .dropdown-item, .github-menu-item');
        if ((await dropdownOptions.count()) > 0) {
          await dropdownOptions.first().hover();

          await expect(page).toHaveScreenshot("topbar-github-option-hover.png", { fullPage: true });
        }
      }
    });
  });

  test.describe("Top Bar Notes Dropdown", () => {
    test("notes dropdown - initial state", async ({ browser }) => {
      const context = await browser.newContext(getCommonContext());
      const page = await context.newPage();
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const notesDropdown = page.locator(
        '[data-testid="notes-dropdown"], button:has-text("Notes"), [aria-label*="notes"], .notes-dropdown',
      );
      if ((await notesDropdown.count()) > 0) {
        await notesDropdown.first().click();

        await expect(page).toHaveScreenshot("topbar-notes-dropdown.png", { fullPage: true });
      }
    });

    test("selecting note on and off", async ({ browser }) => {
      const context = await browser.newContext(getCommonContext());
      const page = await context.newPage();
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const notesDropdown = page.locator(
        '[data-testid="notes-dropdown"], button:has-text("Notes"), [aria-label*="notes"], .notes-dropdown',
      );
      if ((await notesDropdown.count()) > 0) {
        await notesDropdown.first().click();

        const noteOptions = page.locator('[type="checkbox"], .note-option, [role="menuitemcheckbox"]');
        if ((await noteOptions.count()) > 0) {
          await noteOptions.first().click();

          await expect(page).toHaveScreenshot("topbar-notes-selected-on.png", { fullPage: true });

          await noteOptions.first().click();

          await expect(page).toHaveScreenshot("topbar-notes-selected-off.png", { fullPage: true });
        }
      }
    });
  });

  test.describe("Settings", () => {
    test("settings modal or panel", async ({ page }) => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const moreButton = page.locator('button:has-text("...")');
      await moreButton.first().click();
      await expect(page).toHaveScreenshot("topbar-more-clicked.png", { fullPage: true });
      const settingsMenuItem = page.locator("role=menuitem", { hasText: "Settings" });
      await settingsMenuItem.click();
      await expect(page).toHaveScreenshot("topbar-more-settings-clicked.png", { fullPage: true });
    });
  });
});
