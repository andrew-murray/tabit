// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

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
    await expect(page.getByText("kuva")).toBeVisible();
  });

  test("displays the song title", async ({ page }) => {
    await expect(page.getByText("kuva")).toBeVisible();
  });

  test("shows all patterns in the drawer", async ({ page }) => {
    for (const name of EXAMPLE_PATTERNS) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("can navigate to each pattern", async ({ page }) => {
    for (const name of EXAMPLE_PATTERNS) {
      await page.getByText(name).click();
      await expect(page).toHaveURL(/\/example/);
      // song title remains visible after each navigation
      await expect(page.getByText("kuva")).toBeVisible();
    }
  });

  // Default state checks

  test("default state is locked", async ({ page }) => {
    await expect(page.getByTestId("LockIcon")).toBeVisible();
    await expect(page.getByTestId("LockOpenIcon")).not.toBeVisible();
  });

  test("default state is not compact", async ({ page }) => {
    // CalendarViewDayIcon = "show compact layout" button - visible when not compact
    await expect(page.getByTestId("CalendarViewDayIcon")).toBeVisible();
  });

  // Lock toggle
  // Note: editing behavior (locked vs unlocked) is tested in e2e/editing.spec.js

  test("lock button unlocks editing", async ({ page }) => {
    await page.getByTestId("LockIcon").click();
    await expect(page.getByTestId("LockOpenIcon")).toBeVisible();
    await expect(page.getByTestId("LockIcon")).not.toBeVisible();
  });

  test("unlock button re-locks editing", async ({ page }) => {
    await page.getByTestId("LockIcon").click();
    await page.getByTestId("LockOpenIcon").click();
    await expect(page.getByTestId("LockIcon")).toBeVisible();
  });

  // Compact toggle
  // CalendarViewDayIcon = "show compact layout" (not compact)
  // ViewListIcon = "show expanded layout" (compact)

  test("compact button toggles icon", async ({ page }) => {
    await page.getByTestId("CalendarViewDayIcon").click();
    await expect(page.getByTestId("ViewListIcon")).toBeVisible();
    await expect(page.getByTestId("CalendarViewDayIcon")).not.toBeVisible();
  });

  test("compact button toggles back", async ({ page }) => {
    await page.getByTestId("CalendarViewDayIcon").click();
    await page.getByTestId("ViewListIcon").click();
    await expect(page.getByTestId("CalendarViewDayIcon")).toBeVisible();
  });

  // TODO: Check the pattern renders differently in compact vs expanded mode
  // (instrument names change position, content compacted vertically)

  // Export

  test("download button exports a .tabit file", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("SaveAltIcon").click();
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

// formatSettings are loaded from kuva.tabit on startup. These tests verify that
// the correct values from the file are applied to the UI's initial state.
test.describe("formatSettings initialized from kuva.tabit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText("kuva")).toBeVisible();
  });

  // formatSettings.compactDisplay: false
  test("compactDisplay false - compact toggle shows 'enter compact mode' icon", async ({
    page,
  }) => {
    await expect(page.getByTestId("CalendarViewDayIcon")).toBeVisible();
    await expect(page.getByTestId("ViewListIcon")).not.toBeVisible();
  });

  // SongView.state.locked: true - hardcoded in SongView, not from the file.
  // The file does not control locked state; editing always starts disabled.
  test("locked true - editing starts disabled regardless of file contents", async ({
    page,
  }) => {
    await expect(page.getByTestId("LockIcon")).toBeVisible();
  });

  // audioState.tempo: 100 (from kuva.tabit audioState)
  test("tempo initializes to 100 bpm from audioState", async ({ page }) => {
    // MUI Slider puts aria-valuenow on the inner thumb element (role="slider"),
    // not on the root span that receives data-testid.
    await expect(
      page.getByTestId("tempo-slider").getByRole("slider"),
    ).toHaveAttribute("aria-valuenow", "100");
  });

  // formatSettings.showBeatNumbers: true
  // The beat-number row (|1---|2---|...) appears above the notation in each instrument part.
  test("showBeatNumbers true - beat number row visible above notation", async ({
    page,
  }) => {
    const firstPart = page.getByTestId("instrument-part").first();
    // k-1 has beatResolution=48 and primaryResolution=12 (4 notes per beat)
    // so beat 1 renders as "1---" in the number row
    await expect(firstPart).toContainText("|1---");
  });

  // formatSettings.hideEmptyParts: true
  // Instruments whose tracks are all empty are not rendered.
  // lightbulb has notes only for Bass and Snare; Bass 2 / Djembe / Shaker are empty.
  test("hideEmptyParts true - empty instruments not rendered for lightbulb", async ({
    page,
  }) => {
    await page.getByText("lightbulb").click();
    const parts = page.getByTestId("instrument-part");
    await expect(parts.filter({ hasText: "Bass" })).toBeVisible();
    await expect(parts.filter({ hasText: "Snare" })).toBeVisible();
    await expect(parts.filter({ hasText: "Bass 2" })).not.toBeVisible();
    await expect(parts.filter({ hasText: "Djembe" })).not.toBeVisible();
    await expect(parts.filter({ hasText: "Shaker" })).not.toBeVisible();
  });
});

// Checks the rendered notation text for each pattern and instrument.
// EXPECTED_NOTATION values are null (TODO) until populated.
// To populate: run `yarn test:e2e`, note the actual output in the failure messages,
// and fill in the corresponding entries in EXPECTED_NOTATION above.
test.describe("Notation rendered for each pattern", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByText("kuva")).toBeVisible();
  });

  for (const patternName of EXAMPLE_PATTERNS) {
    test(`${patternName} - correct instruments visible and notation correct`, async ({
      page,
    }) => {
      await page.getByText(patternName).click();

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
