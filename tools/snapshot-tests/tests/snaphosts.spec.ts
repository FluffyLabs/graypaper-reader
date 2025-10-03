import { expect, test } from "@playwright/test";
const hostname = "http://localhost:5173";

test('page title is "Gray Paper Reader"', async ({ page }) => {
  await page.goto(hostname);

  await expect(page).toHaveTitle("Gray Paper Reader");
});

test("homepage screenshot", async ({ page }) => {
  await page.goto(hostname, { waitUntil: "networkidle" });

  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveScreenshot({ fullPage: true });
});
