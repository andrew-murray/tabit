// @ts-check
// Tests for specific songs/data

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { makeHistoryEntry, seedHistory, readHistory, decodeState } = require("./storage-helpers");

const crazyTSIG = fs.readFileSync(path.join(__dirname, "../test_data/crazy-tsig.h2song"));

const github_issues_link = "https://github.com/andrew-murray/tabit/issues";

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
    const errorDialog = page.getByTestId("global-error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText(github_issues_link)
    await expect(errorDialog).toContainText("FileImportSongView");
    await expect(errorDialog).toContainText("crazy-tsig.h2song");
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
    const errorDialog = page.getByTestId("global-error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText(github_issues_link)
    await expect(errorDialog).toContainText("FileImportSongView");
    await expect(errorDialog).toContainText("test-data");
  });
});