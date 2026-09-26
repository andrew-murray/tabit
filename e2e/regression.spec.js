// @ts-check
// Tests for specific songs/data

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { makeHistoryEntry, seedHistory, readHistory, decodeState } = require("./storage-helpers");

const crazyTSIG = fs.readFileSync(path.join(__dirname, "../test_data/crazy-tsig.h2song"));

test.describe("SongView - regression cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    page.on('console', (msg) => {
        console.log(msg);
    });
  });

  test("crazy time signature creates useful error", async ({
    page,
  }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "crazy-tsig.h2song",
      mimeType: "text/xml",
      buffer: Buffer.from(crazyTSIG),
    });
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await expect(page.getByText(/Failed to load recently viewed song/)).toBeVisible();
  });

  test("non-json-file creates useful error", async ({
    page,
  }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-data",
      mimeType: "application/json",
      buffer: Buffer.from("I'm not json"),
    });
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await expect(page.getByText(/Failed to load recently viewed song/)).toBeVisible();
  });
});