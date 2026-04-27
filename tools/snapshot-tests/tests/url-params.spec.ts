import { expect, test } from "@playwright/test";
import { waitForPdfReady } from "./utils/wait-for-pdf";

const port = process.env.PLAYWRIGHT_PORT || "5173";
const host = process.env.PLAYWRIGHT_HOST || "localhost";
const origin = `http://${host}:${port}`;

const SEARCH_INPUT = 'input[placeholder*="search"]';
const PDF_SCROLL_CONTAINER = ".pdfViewer";

async function getScrollTop(page: import("@playwright/test").Page) {
  return await page.evaluate(() => {
    const viewer = document.querySelector(".pdfViewer");
    return viewer?.parentElement?.scrollTop ?? 0;
  });
}

test.describe("URL ?search and ?section parsing", () => {
  test("fills search input when URL has ?search (no version segment)", async ({ page }) => {
    await page.goto(`${origin}/#/?search=protocol`, { waitUntil: "networkidle" });
    await waitForPdfReady(page);

    const input = page.locator(SEARCH_INPUT).first();
    await expect(input).toHaveValue("protocol");
  });

  test("fills search input when URL has ?search with a version segment", async ({ page }) => {
    await page.goto(`${origin}/#/0.7.2?search=protocol`, { waitUntil: "networkidle" });
    await waitForPdfReady(page);

    const input = page.locator(SEARCH_INPUT).first();
    await expect(input).toHaveValue("protocol");
  });

  test("scrolls to section when URL has ?section (no version segment)", async ({ page }) => {
    await page.goto(`${origin}/#/?section=Header`, { waitUntil: "networkidle" });
    await waitForPdfReady(page);
    await page.locator(PDF_SCROLL_CONTAINER).waitFor({ state: "visible" });

    await expect.poll(() => getScrollTop(page), { timeout: 8_000, intervals: [200] }).toBeGreaterThan(1_000);
  });

  test("scrolls to section AND fills search when URL has both", async ({ page }) => {
    await page.goto(`${origin}/#/?search=hash&section=Header`, { waitUntil: "networkidle" });
    await waitForPdfReady(page);

    const input = page.locator(SEARCH_INPUT).first();
    await expect(input).toHaveValue("hash");

    await expect.poll(() => getScrollTop(page), { timeout: 8_000, intervals: [200] }).toBeGreaterThan(1_000);
  });

  test("subsequent navigation drops ?search/?section from the URL", async ({ page }) => {
    // Open with search/section so they end up in URL after the redirect.
    await page.goto(`${origin}/#/?search=protocol&section=Header`, { waitUntil: "networkidle" });
    await waitForPdfReady(page);
    await expect(page).toHaveURL(/[?&]search=protocol/);
    await expect(page).toHaveURL(/[?&]section=Header/);

    // Simulate the user navigating to a "plain" URL within the same SPA session
    // (e.g. version change from the UI). The next URL must not retain search/section.
    await page.evaluate(() => {
      window.location.hash = "#/0.7.2?v=0.7.2";
    });

    await expect(page).not.toHaveURL(/[?&]search=/);
    await expect(page).not.toHaveURL(/[?&]section=/);
  });
});
