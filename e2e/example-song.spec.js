// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { EXAMPLE_PATTERNS, getPatternNotation, EXPECTED_NOTATION } = require("./kuva-helpers");

/**
 * This test suite covers basic attributes of how a SongView should behave, using the example.
 * This checks that
 *    - the page initialises and shows the nav components correctly (lists patterns, shows title bar)
 *    - pattern-nav-components navigate to the pattern correctly
 *    - exhaustive test of the notation display (under default conditions)
 *    - the download widget correctly downloads the example
 */

// Fixture files may have CRLF line endings on Windows/Linux shared filesystems.
const normalizeNewlines = (s) => s.replace(/\r\n/g, "\n");

test.describe("Example song page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    // wait for the song to load asynchronously
    await expect(page.getByTestId("song-title")).toBeVisible();
  });

  test("displays the song title", async ({ page }) => {
    await expect(page.getByTestId("song-title")).toContainText("kuva");
  });

  test("shows all patterns in the drawer", async ({ page }) => {
    for (const name of EXAMPLE_PATTERNS) {
      await expect(page.getByTestId("pattern-list").getByRole("button", { name, exact: true })).toBeVisible();
    }
  });

  test("can navigate to each pattern", async ({ page }) => {
    for (const name of EXAMPLE_PATTERNS) {
      await page.getByTestId("pattern-list").getByRole("button", { name, exact: true }).click();
      await expect(page).toHaveURL(/\/example/);
      // song title remains visible after each navigation
      await expect(page.getByTestId("song-title")).toBeVisible();
    }
  });

  // Default state checks

  test("default state is locked", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Unlock editing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lock editing", exact: true })).not.toBeVisible();
  });

  test("default state is not compact", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Show compact layout" })).toBeVisible();
  });

  // Lock toggle
  // Note: editing behavior (locked vs unlocked) is tested in e2e/editing.spec.js

  test("lock button unlocks editing", async ({ page }) => {
    await page.getByRole("button", { name: "Unlock editing" }).click();
    await expect(page.getByRole("button", { name: "Lock editing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unlock editing" })).not.toBeVisible();
  });

  test("unlock button re-locks editing", async ({ page }) => {
    await page.getByRole("button", { name: "Unlock editing" }).click();
    await page.getByRole("button", { name: "Lock editing" }).click();
    await expect(page.getByRole("button", { name: "Unlock editing" })).toBeVisible();
  });

  // Compact toggle
  // "Show compact layout" button is visible when not compact (clicking enters compact mode)
  // "Show expanded layout" button is visible when compact (clicking exits compact mode)

  test("compact button toggles icon", async ({ page }) => {
    await page.getByRole("button", { name: "Show compact layout" }).click();
    await expect(page.getByRole("button", { name: "Show expanded layout" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Show compact layout" })).not.toBeVisible();
  });

  test("compact button toggles back", async ({ page }) => {
    await page.getByRole("button", { name: "Show compact layout" }).click();
    await page.getByRole("button", { name: "Show expanded layout" }).click();
    await expect(page.getByRole("button", { name: "Show compact layout" })).toBeVisible();
  });

  // TODO: Check the pattern renders differently in compact vs expanded mode
  // (instrument names change position, content compacted vertically)

  // Export

  test("download button exports a .tabit file", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("kuva.tabit");
    const savedPath = await download.path();
    const content = JSON.parse(
      normalizeNewlines(fs.readFileSync(savedPath, "utf8")),
    );
    const fixture = JSON.parse(
      normalizeNewlines(
        fs.readFileSync(
          path.join(__dirname, "../test_data/kuva.tabit"),
          "utf8",
        ),
      ),
    );
    expect(content).toEqual(fixture);
  });
});

// Checks the rendered notation text for each pattern and instrument.
test.describe("Notation rendered for each pattern", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByTestId("song-title")).toBeVisible();
  });

  for (const patternName of EXAMPLE_PATTERNS) {
    test(`${patternName} - correct instruments visible and notation correct`, async ({
      page,
    }) => {
      await page.getByTestId("pattern-list").getByRole("button", { name: patternName, exact: true }).click();

      page.on("console", (msg) => console.log(msg.text()));

      const actual = await getPatternNotation(page);
      const expected = EXPECTED_NOTATION[patternName];

      // Always check that exactly the right set of instruments is visible.
      // This verifies hideEmptyParts behavior even before notation values are populated.
      expect(Object.keys(actual).sort(), "visible instruments").toEqual(
        Object.keys(expected).sort(),
      );

      // For each instrument with a populated expected value, check the notation text.
      // Null = TODO, skipped until filled in.
      for (const [instrument, expectedText] of Object.entries(expected)) {
        if (expectedText !== null) {
          const expectedTextWithHeader = instrument + "\n" + expectedText;
          expect(actual[instrument], `notation for ${instrument}`).toBe(
            expectedTextWithHeader,
          );
        }
      }
    });
  }
});
