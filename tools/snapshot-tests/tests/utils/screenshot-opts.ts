import type { Page } from "@playwright/test";

/**
 * Build `toHaveScreenshot` options that mask out the rendered PDF.
 *
 * The PDF.js canvas can render a few pixels off between otherwise identical
 * runs. That shift is not a regression we care about in these layout/chrome
 * snapshots, but it trips the pixel-diff threshold because shifted text
 * changes a band of pixels around every glyph. Masking the PDF viewer(s) lets
 * us keep a tight threshold on the surrounding UI while ignoring the
 * inherently non-deterministic PDF region.
 *
 * The selector matches both the main viewer and any split-pane viewer.
 */
export function maskedPdfScreenshot(page: Page) {
  return {
    fullPage: true,
    mask: [page.locator(".pdf-viewer-root")],
  };
}
