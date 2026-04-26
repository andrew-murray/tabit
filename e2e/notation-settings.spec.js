// @ts-check
// Smoke tests for formatSettings that affect notation display.
// Each test loads kuva.tabit with one setting changed to a non-default value,
// asserts the expected visual effect, then toggles the setting back to default
// via the in-app UI and asserts the notation reverts.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const KUVA_TABIT = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../test_data/kuva.tabit"), "utf8"),
);

// Load kuva.tabit with the given formatSettings overrides via the title-screen file import.
// Resolves once SongView has rendered (song title visible in app bar).
// On load, the first pattern (k-1) is selected and the pattern drawer is open.
async function loadWithSettings(page, overrides) {
  const modified = {
    ...KUVA_TABIT,
    formatSettings: { ...KUVA_TABIT.formatSettings, ...overrides },
  };
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.tabit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(modified)),
  });
  await expect(page.getByText("kuva")).toBeVisible();
}

// Open the Settings drawer and wait for its controls to be visible.
async function openSettingsDrawer(page) {
  await page.getByTestId("SettingsIcon").click();
  // "Show Beat Numbers" is always present in the Song tab - use it as the ready signal
  await expect(page.getByText("Show Beat Numbers")).toBeVisible();
}

test.describe("Notation display settings", () => {
  // -------------------------------------------------------------------------
  // compactDisplay
  // Controlled via the TabitBar compact button (not in the settings drawer).
  // When true: Pattern renders <Part> with short-name prefixes, no <article> headings.
  // When false (default): Pattern renders <PartWithTitle> with <article> + <h4> per instrument.
  // -------------------------------------------------------------------------
  test("compactDisplay - toggling compact removes and restores instrument headings", async ({
    page,
  }) => {
    await loadWithSettings(page, { compactDisplay: true });

    // Compact mode: no <article data-testid="instrument-part"> elements, no h4 headings
    await expect(page.getByTestId("instrument-part")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);

    // Toggle back via ViewListIcon (shown in app bar when compact=true)
    await page.getByTestId("ViewListIcon").click();

    // Expanded mode restored: k-1 has 5 instruments, all with notes
    await expect(page.getByTestId("instrument-part")).toHaveCount(5);
    await expect(page.getByRole("heading", { level: 4 })).toHaveCount(5);
  });

  // -------------------------------------------------------------------------
  // showBeatNumbers (bool toggle in drawer)
  // When true (default): a beat-number row (|1---|2---|...) appears above each
  // instrument's notation.
  // When false: that row is absent.
  // -------------------------------------------------------------------------
  test("showBeatNumbers - toggling off removes beat number row, toggling on restores it", async ({
    page,
  }) => {
    await loadWithSettings(page, { showBeatNumbers: false });

    const firstPart = page.getByTestId("instrument-part").first();
    // k-1 has 4 notes per beat; number row would start with |1--- if visible
    await expect(firstPart).not.toContainText("|1---");

    // Toggle back via settings drawer
    await openSettingsDrawer(page);
    await page.getByText("Show Beat Numbers").click();

    await expect(firstPart).toContainText("|1---");
  });

  // -------------------------------------------------------------------------
  // showBeatMark (bool toggle in drawer)
  // When true (default): "|" separators appear between beats within a line.
  // When false: beats run together with no separator.
  // -------------------------------------------------------------------------
  test("showBeatMark - toggling off removes beat separators, toggling on restores them", async ({
    page,
  }) => {
    await loadWithSettings(page, { showBeatMark: false });

    const firstPart = page.getByTestId("instrument-part").first();
    // k-1 Bass: beats 1 and 2 normally separated by |, without beat marks they run together
    await expect(firstPart).not.toContainText("O-O-|XO--");
    await expect(firstPart).toContainText("O-O-XO--");

    // Toggle back
    await openSettingsDrawer(page);
    await page.getByText("Show Beat Mark").click();

    await expect(firstPart).toContainText("O-O-|XO--");
  });

  // -------------------------------------------------------------------------
  // hideEmptyParts (bool toggle in drawer)
  // When true (default): instruments with no notes are not rendered.
  // When false: all instruments rendered regardless.
  // lightbulb has notes only in Bass and Snare; Bass 2, Djembe, Shaker are empty.
  // -------------------------------------------------------------------------
  test("hideEmptyParts - toggling off shows empty instruments, toggling on hides them", async ({
    page,
  }) => {
    await loadWithSettings(page, { hideEmptyParts: false });
    await page.getByText("lightbulb").click();

    // All 5 instruments visible
    await expect(page.getByTestId("instrument-part")).toHaveCount(5);

    // Toggle back
    await openSettingsDrawer(page);
    await page.getByText("Hide Empty Parts").click();

    // Only Bass and Snare remain (2 parts)
    await expect(page.getByTestId("instrument-part")).toHaveCount(2);
  });

  // -------------------------------------------------------------------------
  // restMark (dropdown in drawer, options: "-" / "." / " ")
  // Controls the character rendered at empty note positions (default: "-").
  // -------------------------------------------------------------------------
  test("restMark - changing to '.' replaces dashes with dots, reverting restores dashes", async ({
    page,
  }) => {
    await loadWithSettings(page, { restMark: "." });

    const firstPart = page.getByTestId("instrument-part").first();
    // k-1 Bass: |O-O-| becomes |O.O.|
    await expect(firstPart).toContainText("O.O.");
    await expect(firstPart).not.toContainText("O-O-");

    // Revert via settings drawer dropdown
    await openSettingsDrawer(page);
    await page.getByTestId("settings-control-restMark").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "-" }).click();

    await expect(firstPart).toContainText("O-O-");
    await expect(firstPart).not.toContainText("O.O.");
  });

  // -------------------------------------------------------------------------
  // numberRestMark (dropdown in drawer, options: "-" / "." / " ")
  // Controls the rest character in the beat-number row (default: "-").
  // -------------------------------------------------------------------------
  test("numberRestMark - changing to '.' changes number row rests, reverting restores dashes", async ({
    page,
  }) => {
    await loadWithSettings(page, { numberRestMark: "." });

    const firstPart = page.getByTestId("instrument-part").first();
    // Beat 1 in the number row: "1---" becomes "1..."
    await expect(firstPart).toContainText("|1...");
    await expect(firstPart).not.toContainText("|1---");

    // Revert via settings drawer dropdown
    await openSettingsDrawer(page);
    await page.getByTestId("settings-control-numberRestMark").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "-" }).click();

    await expect(firstPart).toContainText("|1---");
    await expect(firstPart).not.toContainText("|1...");
  });

  // -------------------------------------------------------------------------
  // smartTupletFormatting (bool toggle in drawer)
  // When true (default): alternative resolution (triplet/duplet) is detected and
  // a subscript marker ("3 " or "2 ") is appended to affected beats.
  // When false: no alternative resolution; beats render using the primary resolution only.
  // lightbulb Bass exhibits this: the last beat shows "OOO3 " with smart formatting.
  // -------------------------------------------------------------------------
  test("smartTupletFormatting - toggling off removes tuplet markers, toggling on restores them", async ({
    page,
  }) => {
    await loadWithSettings(page, { smartTupletFormatting: false });
    await page.getByText("lightbulb").click();

    const firstPart = page.getByTestId("instrument-part").first();
    // Without smart formatting, lightbulb Bass beat 4 renders using primary resolution
    // only; the three triplet notes don't align to the grid and appear as undefinedMark
    // (kuva.tabit sets undefinedMark: "3"), producing "|O33-|" instead of "|OOO3 |"
    await expect(firstPart).toContainText("|O33-|");
    await expect(firstPart).not.toContainText("|OOO3 |");

    // Toggle back
    await openSettingsDrawer(page);
    await page.getByText("Smart Tuplet Formatting").click();

    // With smart formatting restored, triplet beat renders correctly as "|OOO3 |"
    await expect(firstPart).toContainText("|OOO3 |");
    await expect(firstPart).not.toContainText("|O33-|");
  });
});
