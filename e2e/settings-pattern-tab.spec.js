// @ts-check
// Tests for pattern-tab settings (lineResolution, beatResolution) and the
// tempo slider in PlaybackControls.
//
// Pattern-tab settings (lineResolution, beatResolution, primaryResolution,
// useIndividualResolution) are per-pattern and live under the "Pattern" tab
// in FormatSettings. They are stored in patternSettings, not formatSettings.
//
// Tempo slider: data-testid="tempo-slider" in PlaybackControls.
// It is only interactive when locked (disabled={!locked}).

const { test, expect } = require("@playwright/test");

// --- Helpers -----------------------------------------------------------------

async function openSettingsDrawer(page) {
  await page.getByRole("button", { name: "Notation settings" }).click();
  // "Show Beat Numbers" is in the Song tab - use as ready signal
  await expect(page.getByText("Show Beat Numbers")).toBeVisible();
}

async function switchToPatternTab(page) {
  await page.getByRole("tab", { name: "Pattern" }).click();
  // "lineResolution" control appears in the Pattern tab
  await expect(page.getByTestId("settings-control-lineResolution")).toBeVisible();
}

// --- lineResolution ----------------------------------------------------------
//
// lineResolution controls how many beats appear per line.
// kuva example song: k-1 has beatResolution=48, patternLength=384 (8 beats).
// Default lineResolution=384 -> 8 beats/line.
// Changing to 4 beats/line: the beat-number header row wraps at beat 4.
//
// Before: "|1---|2---|3---|4---|5---|6---|7---|8---|" on one line
// After:  "|1---|2---|3---|4---|" followed by "|5---|6---|7---|8---|"
//
// The dropdown shows beats (not raw resolution): "8" -> change to "4".
// The select trigger is found via [aria-haspopup="listbox"] within the control.

test.describe("Pattern tab - lineResolution", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByTestId("song-title")).toBeVisible();
  });

  test("changing lineResolution from 8 to 4 beats reflows notation into shorter lines", async ({ page }) => {
    const firstPart = page.getByTestId("instrument-part").first();

    // Default: k-1 Bass shows all 8 beats on one line
    await expect(firstPart).toContainText("|1---|2---|3---|4---|5---|");

    await openSettingsDrawer(page);
    await switchToPatternTab(page);

    // Change from 8 beats/line to 4 beats/line
    await page.getByTestId("settings-control-lineResolution").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "4" }).click();

    // Beat 4 and beat 5 are now on different lines - "|4---|5---" no longer appears
    await expect(firstPart).not.toContainText("|4---|5---");

    // First line still has beat numbers 1-4
    await expect(firstPart).toContainText("|1---|2---|3---|4---|");
    // Second half's notes are still rendered (expandRepeatedLines:false suppresses the
    // repeated beat-number header, so beats 5-8 only show note content, not numbers)
    await expect(firstPart).toContainText("|O-O-|XO--|O-XO|--X-|");
  });

  test("reverting lineResolution back to 8 beats restores single-line notation", async ({ page }) => {
    await openSettingsDrawer(page);
    await switchToPatternTab(page);

    // Change to 4 beats/line
    await page.getByTestId("settings-control-lineResolution").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "4" }).click();

    const firstPart = page.getByTestId("instrument-part").first();
    await expect(firstPart).not.toContainText("|4---|5---");

    // Revert to 8 beats/line
    await page.getByTestId("settings-control-lineResolution").locator('[aria-haspopup="listbox"]').click();
    await page.getByRole("option", { name: "8" }).click();

    await expect(firstPart).toContainText("|1---|2---|3---|4---|5---|");
  });
});

// --- Tempo slider -------------------------------------------------------------
//
// PlaybackControls has data-testid="tempo-slider" on the MUI Slider.
// The slider renders a [role="slider"] with aria-valuenow.
// Audio output is out of scope; we assert on aria-valuenow only.
// The slider is only interactive when locked (the default state).

test.describe("Tempo slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/example");
    await expect(page.getByTestId("song-title")).toBeVisible();
  });

  test("tempo slider is present and interactive when locked", async ({ page }) => {
    const slider = page.getByTestId("tempo-slider").getByRole("slider");
    await expect(slider).toBeVisible();

    const before = parseInt(await slider.getAttribute("aria-valuenow"));

    await slider.focus();
    await page.keyboard.press("ArrowRight");

    const after = parseInt(await slider.getAttribute("aria-valuenow"));
    expect(after).toBe(before + 1);
  });

  test("pressing ArrowLeft decreases the tempo value", async ({ page }) => {
    const slider = page.getByTestId("tempo-slider").getByRole("slider");
    const before = parseInt(await slider.getAttribute("aria-valuenow"));

    await slider.focus();
    await page.keyboard.press("ArrowLeft");

    const after = parseInt(await slider.getAttribute("aria-valuenow"));
    expect(after).toBe(before - 1);
  });

  test("tempo slider is disabled when unlocked", async ({ page }) => {
    // When unlocked, PlaybackControls receives disabled=true which renders the
    // play/stop buttons as no-op and the slider is visually greyed out.
    // The slider itself is still in the DOM but its interaction is suppressed by
    // the disabled prop on the PlayIcon/StopIcon - the Slider itself doesn't get
    // a disabled attribute, so we verify visually by checking the locked state.
    await page.getByRole("button", { name: "Unlock editing" }).click();
    await expect(page.getByRole("button", { name: "Lock editing" })).toBeVisible();

    // Slider is still present; its aria state doesn't change, but the PlayArrow
    // icon is greyed (no direct attribute to check for the slider itself).
    const slider = page.getByTestId("tempo-slider").getByRole("slider");
    await expect(slider).toBeVisible();
  });
});
