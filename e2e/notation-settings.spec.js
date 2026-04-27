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

// Load arbitrary song data (any top-level fields can be overridden).
async function loadSong(page, songData) {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.tabit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(songData)),
  });
  await expect(page.getByText(songData.songName)).toBeVisible();
}

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

  // -------------------------------------------------------------------------
  // undefinedMark (dropdown in drawer, options: "?", "o", "3", "4", "#", etc.)
  // Controls the character rendered for notes that don't align to the display
  // grid. Easiest to observe with smartTupletFormatting:false, which forces
  // lightbulb's triplet notes through the primary resolution and renders them
  // as undefinedMark. kuva.tabit already sets undefinedMark:"3".
  // -------------------------------------------------------------------------
  test("undefinedMark - changing the mark changes how off-grid notes render", async ({
    page,
  }) => {
    // With smartTupletFormatting off, lightbulb Bass shows "|O33-|" (undefinedMark="3")
    await loadWithSettings(page, { smartTupletFormatting: false });
    await page.getByText("lightbulb").click();

    const firstPart = page.getByTestId("instrument-part").first();
    await expect(firstPart).toContainText("|O33-|");

    // Change undefinedMark from "3" to "#"
    await openSettingsDrawer(page);
    await page.getByTestId("settings-control-undefinedMark").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "#" }).click();

    await expect(firstPart).toContainText("|O##-|");
    await expect(firstPart).not.toContainText("|O33-|");

    // Revert to "3"
    await page.getByTestId("settings-control-undefinedMark").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "3" }).click();

    await expect(firstPart).toContainText("|O33-|");
    await expect(firstPart).not.toContainText("|O##-|");
  });

  // -------------------------------------------------------------------------
  // hideMutedParts (bool toggle in drawer)
  // When true (default): instruments with muted:true in instruments[i][3] are
  // not rendered.
  // When false: all instruments rendered regardless of muted state.
  // Test data: kuva modified so Bass (instruments[0]) has muted:true.
  // k-1 has 5 instruments all with notes; with Bass muted + hideMutedParts:true
  // only 4 are visible.
  // -------------------------------------------------------------------------
  test("hideMutedParts - muted instruments are hidden by default and visible when setting disabled", async ({
    page,
  }) => {
    const bass = KUVA_TABIT.instruments[0];
    const kuvaWithMutedBass = {
      ...KUVA_TABIT,
      instruments: [
        [bass[0], bass[1], bass[2], { ...bass[3], muted: true }],
        ...KUVA_TABIT.instruments.slice(1),
      ],
    };
    await loadSong(page, kuvaWithMutedBass);

    // k-1: 5 instruments all with notes, Bass is muted -> only 4 visible
    await expect(page.getByTestId("instrument-part")).toHaveCount(4);

    // Toggle hideMutedParts off -> all 5 visible
    await openSettingsDrawer(page);
    await page.getByText("Hide Muted Parts").click();
    await expect(page.getByTestId("instrument-part")).toHaveCount(5);

    // Toggle back on -> Bass hidden again
    await page.getByText("Hide Muted Parts").click();
    await expect(page.getByTestId("instrument-part")).toHaveCount(4);
  });

  // -------------------------------------------------------------------------
  // showHelp (toggle in the SettingsDrawer, not in FormatSettings)
  // SongView initial state: showHelp:true. The Switch reflects this.
  // Toggling off/on changes the Switch checked state.
  // -------------------------------------------------------------------------
  test("showHelp toggle - can be turned off and on via settings drawer", async ({
    page,
  }) => {
    await loadWithSettings(page, {});
    await openSettingsDrawer(page);

    const helpToggle = page.getByLabel("Show Help");

    // Default is showHelp:true
    await expect(helpToggle).toBeChecked();

    // Toggle off
    await helpToggle.click();
    await expect(helpToggle).not.toBeChecked();

    // Toggle back on
    await helpToggle.click();
    await expect(helpToggle).toBeChecked();
  });
});
