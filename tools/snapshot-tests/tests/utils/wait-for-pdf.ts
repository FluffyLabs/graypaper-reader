import type { Page } from "@playwright/test";

/**
 * Wait for the main PDF viewer to fully render (pages loaded + scale applied).
 * The PdfViewer component sets data-pdf-ready on its root once the
 * "pagesloaded" event has fired and the initial scale has been applied.
 */
export async function waitForPdfReady(page: Page, timeout = 15_000) {
  await page.locator("[data-pdf-ready]").first().waitFor({ state: "visible", timeout });
}

/**
 * Wait for the split-pane PDF viewer to fully render.
 */
export async function waitForSplitPdfReady(page: Page, timeout = 15_000) {
  await page.locator(".split-pane-view [data-pdf-ready]").first().waitFor({ state: "visible", timeout });
}
