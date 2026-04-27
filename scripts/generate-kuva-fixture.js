// @ts-check
// Generates test_data/kuva.tabit by downloading from the running app.
// Usage: start serve first, then: node scripts/generate-kuva-fixture.js
const { chromium } = require("@playwright/test");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/example");
  await page.waitForSelector("text=kuva");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("SaveAltIcon").click();
  const download = await downloadPromise;

  const destPath = path.join(__dirname, "../test_data/kuva.tabit");
  await download.saveAs(destPath);
  console.log("Saved fixture to", destPath);

  await browser.close();
})();
