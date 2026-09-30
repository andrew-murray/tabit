// @ts-check
// Tests for specific songs/data

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const { getPatternNotation } = require("./kuva-helpers");

const getString = (filepath) => {
  return fs.readFileSync(path.join(__dirname, "../test_data/" + filepath));
};

const getData = (filepath) => {
  return Buffer.from(fs.readFileSync(path.join(__dirname, "../test_data/" + filepath)));
};

const github_issues_link = "https://github.com/andrew-murray/tabit/issues";

test.describe("SongView - regression cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("crazy time signature renders correctly", async ({
    page,
  }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "crazy-tsig.h2song",
      mimeType: "text/xml",
      buffer: getData("crazy-tsig.h2song"),
    });

    await expect(page.getByTestId("song-title")).toBeVisible();
    await page.getByTestId("pattern-list").getByRole("button", { name: "Pattern 1", exact: true }).click();

    // there's only one pattern, we don't check this
    const actual = await getPatternNotation(page);
    expect(Object.keys(actual).sort(), "visible instruments").toEqual(
      ["Snare"]
    );
    const expected = ("Snare\n" 
      + "|1-----------------------------------------------|2-----------------------------------------------|3-----------------------------------------------|4-----------------------------------------------|5|\n"
      + "|x-----------------------------------------------|------------------------------------------------|x-----------------------------------x-----------|x-----------------------------------------------|-|");
    expect(actual["Snare"]).toBe(expected);
  });

  test("broken symbols baseline - renders correctly", async ({
    page,
  }) => {
    await page.locator('input[type="file"]').setInputFiles({
      name: "broken-symbol.tabit",
      mimeType: "text/json",
      buffer: getData("broken-symbol.tabit"),
    });

    await expect(page.getByTestId("song-title")).toBeVisible();
    await page.getByTestId("pattern-list").getByRole("button", { name: "Pattern 1", exact: true }).click();

    // there's only one pattern, we don't check this
    const actual = await getPatternNotation(page);
    expect(Object.keys(actual).sort(), "visible instruments").toEqual(
      ["Snare"]
    );
    const expected = ("Snare\n"
      + "|1---|2---|3---|4---|\n"
      + "|@---|----|@--@|@---|");
    expect(actual["Snare"]).toBe(expected);
  });

  test("broken symbols - produces useful error", async ({
    page,
  }) => {

    const brokenSymbolBaseline = getString("broken-symbol.tabit").toString();
    const symbolCount = (brokenSymbolBaseline.match(/@/g)||[]).length;
    expect(symbolCount).toBe(2);
    const testData = brokenSymbolBaseline.replaceAll("@", "BAD-SYMBOL");

    await page.locator('input[type="file"]').setInputFiles({
      name: "broken-symbol.tabit",
      mimeType: "text/json",
      buffer: Buffer.from(testData),
    });

    await expect(page.getByText("Something went wrong")).toBeVisible();
    const errorDialog = page.getByTestId("global-error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText(github_issues_link)
    await expect(errorDialog).toContainText("FileImportSongView");
    // could make this assertion weaker
    await expect(errorDialog).toContainText("Configured instrument-symbol \\\"BAD-SYMBOL\\\" must be length=1");
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