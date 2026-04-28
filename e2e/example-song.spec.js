// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

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

const EXAMPLE_PATTERNS = ["k-1", "k-2", "lightbulb", "break", "squash"];

// Returns { instrumentName: innerText } for every visible instrument-part on the current page.
// The innerText includes the instrument heading and the notation rows below it, e.g.:
//   "Bass\n|1---|2---|...|8---|\n|O-O-|XO--|...|"
async function getPatternNotation(page) {
  const parts = page.getByTestId("instrument-part");
  const count = await parts.count();
  const result = {};
  for (let i = 0; i < count; i++) {
    const part = parts.nth(i);
    const name = (await part.locator("h4").innerText()).trim();
    result[name] = (await part.innerText()).trim();
  }
  return result;
}

// Expected innerText() for each visible instrument-part, keyed by pattern then instrument name.
// hideEmptyParts=true (from kuva.tabit) means instruments with no notes are absent.
// Null entries are TODOs - populate by running the test and copying the actual output.
const EXPECTED_NOTATION = {
  // k-1: all 5 instruments have notes
  "k-1": {
    Bass: "|1---|2---|3---|4---|5---|6---|7---|8---|\n|O-O-|XO--|X---|X---|O-O-|XO--|O-XO|--X-|",
    "Bass 2":
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X-X-|X-XO|XOO-|O---|X-X-|X--O|O-XO|--X-|",
    Djembe:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|t-tt|t-S-|--O-|O---|t-O-|tO-t|O-tO|--S-|",
    Snare:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|--X-|X---|----|X--X|--X-|X-X-|----|X-XX|",
    Shaker:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|XXXX|X-X-|----|XXX-|X-X-|--X-|XX-X|X-XX|",
  },
  // k-2: all 5 instruments have notes
  "k-2": {
    Bass: "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|X---|X---|X-OO|O---|X---|X---|X---|",
    "Bass 2":
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|X---|X---|X-OO|O---|X---|X---|X---|",
    Djembe:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|OOO-|S---|--tS|-SOO|O-tt|-St-|tt-S|t---|",
    Snare:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X---|X--X|-X-X|X---|X--X|X--X|----|----|",
    Shaker:
      "|1---|2---|3---|4---|5---|6---|7---|8---|\n|X-XX|X-XX|XXX-|--X-|X-XX|X-XX|X-X-|--X-|",
  },
  // lightbulb: only Bass and Snare have notes; Bass 2, Djembe, Shaker are empty
  lightbulb: {
    Bass: "|1---|2---|3---|4---|\n|OOOO|O---|----|OOO3 |",
    Snare: "|1---|2---|3---|4---|\n|----|----|X---|----|",
  },
  // break: Bass 2 is empty; Bass, Djembe, Snare, Shaker have notes
  break: {
    Bass: "|1-|2-|3-|4-|\n|--|--|--|OO|",
    Djembe: "|1-|2-|3-|4-|\n|-t|t-|tt|-t|",
    Snare: "|1-|2-|3-|4-|\n|-X|X-|XX|-X|",
    Shaker: "|1-|2-|3-|4-|\n|-X|X-|XX|-X|",
  },
  // squash: Bass 2 is empty; Bass, Djembe, Snare, Shaker have notes
  squash: {
    Bass: "|1|2|3|4|\n|O|O|O|O|",
    Djembe: "|1|2|3|4|\n|O|O|O|O|",
    Snare: "|1|2|3|4|\n|X|X|X|X|",
    Shaker: "|1|2|3|4|\n|X|X|X|X|",
  },
};

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
    await expect(page.getByRole("button", { name: "Lock editing" })).not.toBeVisible();
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
