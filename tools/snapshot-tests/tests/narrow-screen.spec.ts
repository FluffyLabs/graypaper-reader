import { expect, test } from "@playwright/test";
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

const screenshotOpts = { fullPage: true };

test.describe("Narrow Screen - Bottom Drawer", () => {
  test("narrow layout shows bottom drawer collapsed", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const drawer = page.locator(".bottom-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/collapsed/);

    await expect(page).toHaveScreenshot("narrow-layout-collapsed.png", screenshotOpts);
  });

  test("bottom drawer expands on click", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const handle = page.locator(".drawer-handle");
    await handle.click();

    const drawer = page.locator(".bottom-drawer");
    await expect(drawer).toHaveClass(/expanded/);

    await expect(page).toHaveScreenshot("narrow-layout-expanded.png", screenshotOpts);
  });

  test("bottom drawer collapses on second click", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const handle = page.locator(".drawer-handle");

    // Expand
    await handle.click();
    await expect(page.locator(".bottom-drawer")).toHaveClass(/expanded/);

    // Collapse
    await handle.click();
    await expect(page.locator(".bottom-drawer")).toHaveClass(/collapsed/);

    await expect(page).toHaveScreenshot("narrow-layout-re-collapsed.png", screenshotOpts);
  });

  test("narrow layout does not show split tab", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const handle = page.locator(".drawer-handle");
    await handle.click();
    await expect(page.locator(".bottom-drawer")).toHaveClass(/expanded/);

    const splitTab = page.locator('[data-testid="tab-split"]');
    await expect(splitTab).toHaveCount(0);
  });

  test("narrow layout ignores split URL param", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    await page.goto(`${origin}/#/ab2cdbd?v=0.7.2&split=0.7.2`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const drawer = page.locator(".bottom-drawer");
    await expect(drawer).toBeVisible();

    const splitPane = page.locator(".split-pane-view");
    await expect(splitPane).toHaveCount(0);

    await expect(page).toHaveScreenshot("narrow-layout-ignores-split.png", screenshotOpts);
  });
});

test.describe("Narrow Screen - Tablet", () => {
  test("768px width shows bottom drawer layout", async ({ browser }) => {
    const context = await browser.newContext({
      ...getCommonContext(),
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();

    await page.goto(hostname, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const drawer = page.locator(".bottom-drawer");
    await expect(drawer).toBeVisible();

    await expect(page).toHaveScreenshot("tablet-layout.png", screenshotOpts);
  });
});
