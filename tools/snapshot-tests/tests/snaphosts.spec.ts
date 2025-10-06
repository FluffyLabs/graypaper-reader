import { expect, test } from "@playwright/test";
import { initialLocalStorage } from "./utils/add-notes-to-local-storage";

const origin = "http://localhost:5173";
const hostname = "http://localhost:5173/#/ab2cdbd?v=0.7.2";

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

test.describe("Homepage Tests", () => {
  test('page title is "Gray Paper Reader"', async ({ page }) => {
    await page.goto(hostname);
    await expect(page).toHaveTitle("Gray Paper Reader");
  });

  test("homepage screenshot - with outline", async ({ page }) => {
    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("homepage-outline.png", { fullPage: true });
  });

  test.describe("Notes Tab", () => {
    test("notes tab - initial state", async ({ browser }) => {
      const context = await browser.newContext(getCommonContext());

      const page = await context.newPage();
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      await page.click('[data-testid="tab-notes"]');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot("notes-tab-initial.png", { fullPage: true });

      await page.click('[data-testid="edit-button"]', { timeout: 2500 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("notes-tab-edit.png", { fullPage: true });
    });
  });

  test.describe("Search Functionality", () => {
    test("search - initial state", async ({ page }) => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // Click on search tab or search input
      const searchTab = page.locator('[data-testid="tab-search"]');

      if ((await searchTab.count()) > 0) {
        await searchTab.click();
        await page.waitForTimeout(500);
      }

      await expect(page).toHaveScreenshot("search-initial.png", { fullPage: true });

      const searchInput = page.locator('input[placeholder*="search"]');

      await searchInput.first().fill("protocol");
      await page.waitForTimeout(1000); // Wait for search results

      await expect(page).toHaveScreenshot("search-with-query.png", { fullPage: true });

      // Type more to see updated results
      await searchInput.first().fill("blockchain");
      await page.waitForTimeout(1000);

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
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot("topbar-github-expanded.png", { fullPage: true });

        // Hover over dropdown options
        const dropdownOptions = page.locator('[role="menuitem"], .dropdown-item, .github-menu-item');
        if ((await dropdownOptions.count()) > 0) {
          await dropdownOptions.first().hover();
          await page.waitForTimeout(300);

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
        await page.waitForTimeout(500);

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
        await page.waitForTimeout(500);

        // Find note options/checkboxes
        const noteOptions = page.locator('[type="checkbox"], .note-option, [role="menuitemcheckbox"]');
        if ((await noteOptions.count()) > 0) {
          // Toggle first note on
          await noteOptions.first().click();
          await page.waitForTimeout(300);

          await expect(page).toHaveScreenshot("topbar-notes-selected-on.png", { fullPage: true });

          // Toggle it off
          await noteOptions.first().click();
          await page.waitForTimeout(300);

          await expect(page).toHaveScreenshot("topbar-notes-selected-off.png", { fullPage: true });
        }
      }
    });
  });

  test.describe("Settings", () => {
    test("clicking settings", async ({ page }) => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const settingsButton = page.locator(
        '[data-testid="settings"], button:has-text("Settings"), [aria-label*="settings"], .settings, [data-testid="settings-button"]',
      );
      if ((await settingsButton.count()) > 0) {
        await settingsButton.first().hover();
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot("topbar-settings-hover.png", { fullPage: true });

        await settingsButton.first().click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot("topbar-settings-clicked.png", { fullPage: true });
      }
    });

    test("settings modal or panel", async ({ page }) => {
      await page.goto(hostname, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const moreButton = page.locator('button:has-text("...")');
      await moreButton.first().click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("topbar-more-clicked.png", { fullPage: true });
      const settingsMenuItem = page.locator("role=menuitem", { hasText: "Settings" });
      await settingsMenuItem.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("topbar-more-settings-clicked.png", { fullPage: true });
    });
  });
});
