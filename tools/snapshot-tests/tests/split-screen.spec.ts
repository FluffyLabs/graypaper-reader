import { expect, test } from "@playwright/test";
import { initialLocalStorage } from "./utils/add-notes-to-local-storage";

const port = process.env.PLAYWRIGHT_PORT || "5173";
const host = process.env.PLAYWRIGHT_HOST || "localhost";
const origin = `http://${host}:${port}`;
const hostname = `${origin}/#/ab2cdbd?v=0.7.2`;
const splitHostname = `${origin}/#/ab2cdbd?v=0.7.2&split=0.7.2`;

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

const screenshotOpts = { fullPage: true };

test.describe("Split Screen", () => {
  test("sidebar shows split tab icon", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const splitTab = page.locator('[data-testid="tab-split"]');
    await expect(splitTab).toBeVisible();

    await expect(page).toHaveScreenshot("sidebar-with-split-tab.png", screenshotOpts);
  });

  test("split view opens when clicking split tab", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const splitTab = page.locator('[data-testid="tab-split"]');
    await splitTab.click();
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 5000 });

    await expect(page).toHaveScreenshot("split-view-opened.png", screenshotOpts);
  });

  test("split view opens via URL param", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 5000 });

    await expect(page).toHaveScreenshot("split-view-via-url.png", screenshotOpts);
  });

  test("split pane header - version dropdown", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 10000 });
    // Wait for both PDFs to render
    await page.locator(".split-pane-view .pdfViewer .page").first().waitFor({ state: "visible", timeout: 10000 });

    const versionButton = page.locator(".split-pane-header button").first();
    await versionButton.click({ force: true });
    await page.locator('[role="menu"], [role="radiogroup"]').first().waitFor({ state: "visible", timeout: 5000 });

    await expect(page).toHaveScreenshot("split-header-version-dropdown.png", screenshotOpts);
  });

  test("split pane header - options menu", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 10000 });
    await page.locator(".split-pane-view .pdfViewer .page").first().waitFor({ state: "visible", timeout: 10000 });

    const optionsButton = page.locator(".split-pane-header button:has(svg.lucide-ellipsis)");
    await optionsButton.click({ force: true });
    await page.locator('[role="menu"]').waitFor({ state: "visible", timeout: 5000 });

    await expect(page).toHaveScreenshot("split-header-options-menu.png", screenshotOpts);
  });

  test("sidebar overlay in split mode", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 10000 });
    await page.locator(".split-pane-view .pdfViewer .page").first().waitFor({ state: "visible", timeout: 10000 });

    const sidebarButton = page.locator('.split-pane-header button[title="Toggle sidebar"]');
    await sidebarButton.click({ force: true });
    await page.locator(".sidebar-overlay-panel").waitFor({ state: "visible", timeout: 5000 });

    await expect(page).toHaveScreenshot("split-sidebar-overlay.png", screenshotOpts);
  });

  test("sidebar overlay closes on Escape", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 5000 });

    const sidebarButton = page.locator('.split-pane-header button[title="Toggle sidebar"]');
    await sidebarButton.click({ force: true });
    await page.locator(".sidebar-overlay-panel").waitFor({ state: "visible", timeout: 2500 });

    await page.keyboard.press("Escape");
    await page.locator(".sidebar-overlay-panel").waitFor({ state: "hidden", timeout: 2500 });

    await expect(page).toHaveScreenshot("split-sidebar-overlay-closed.png", screenshotOpts);
  });

  test("split view closes via options menu", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 5000 });

    const optionsButton = page.locator(".split-pane-header button:has(svg.lucide-ellipsis)");
    await optionsButton.click({ force: true });
    await page.locator('[role="menu"]').waitFor({ state: "visible", timeout: 2500 });

    await page.locator('[role="menuitem"]:has-text("Close split view")').click();
    await page.locator(".split-pane-view").waitFor({ state: "hidden", timeout: 2500 });
    await page.locator(".gp-sidebar").waitFor({ state: "visible", timeout: 2500 });

    await expect(page).toHaveScreenshot("split-view-closed.png", screenshotOpts);
  });

  test("split tab not visible in sidebar overlay", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(splitHostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".split-pane-view").waitFor({ state: "visible", timeout: 5000 });

    const sidebarButton = page.locator('.split-pane-header button[title="Toggle sidebar"]');
    await sidebarButton.click({ force: true });
    await page.locator(".sidebar-overlay-panel").waitFor({ state: "visible", timeout: 2500 });

    const splitTabInOverlay = page.locator('.sidebar-overlay-panel [data-testid="tab-split"]');
    await expect(splitTabInOverlay).toHaveCount(0);
  });
});

test.describe("Version Compare", () => {
  test("compare with option in version dropdown", async ({ browser }) => {
    const context = await browser.newContext(getCommonContext());
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    // The version dropdown trigger contains a ChevronDown SVG — find it in the header end slot
    const versionButton = page.locator("button:has(svg.lucide-chevron-down)").first();
    await versionButton.click();
    await page.locator('[role="menu"], [role="radiogroup"]').first().waitFor({ state: "visible", timeout: 5000 });

    const compareSection = page.locator('text="Compare with..."');
    await expect(compareSection).toBeVisible();

    await expect(page).toHaveScreenshot("version-dropdown-with-compare.png", screenshotOpts);
  });
});
