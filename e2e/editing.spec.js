// @ts-check
// Tests for editing interactions: note toggling, pattern reordering,
// song title rename, add pattern, and delete pattern.
//
// Most edits require the song to be unlocked (locked=true on load).
// Notes: clicking cycles through a cell's content via cycleCellContent.
// Pattern reordering: @dnd-kit PointerSensor; drag handles only appear when
// unlocked. Playwright's mouse API dispatches pointer events too, which is
// what PointerSensor listens to.

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { getPatternNotation, EXPECTED_NOTATION } = require("./kuva-helpers");

const KUVA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../test_data/kuva.tabit"), "utf8"),
);

async function loadKuva(page) {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.tabit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(KUVA)),
  });
  await expect(page.getByTestId("song-title")).toContainText(KUVA.songName);
}

async function unlock(page) {
  await page.getByRole("button", { name: "Unlock editing" }).click();
  await expect(page.getByRole("button", { name: "Lock editing", exact: true })).toBeVisible();
}

// --- Note Toggling -----------------------------------------------------------

test.describe("Note toggling", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
  });

  test("notes are not clickable when locked", async ({ page }) => {
    await expect(page.locator(".hoverableNote").first()).not.toBeVisible();
  });

  test("notes become clickable after unlocking", async ({ page }) => {
    await unlock(page);
    await expect(page.locator(".hoverableNote").first()).toBeVisible();
  });

  test("clicking a note changes the notation", async ({ page }) => {
    await unlock(page);

    // k-1 is the default pattern; first instrument-part is Bass
    const before = await getPatternNotation(page);
    expect(before["Bass"]).toBe("Bass\n" + EXPECTED_NOTATION["k-1"]["Bass"]);

    // click the first note in the first instrument-part (Bass beat 1, pos 0 = 'O')
    await page.getByTestId("instrument-part").first().locator(".hoverableNote").first().click();

    // Bass has symbols X (track 23) and O (track 24), sorted by insertion order.
    // 'O' is the last symbol in the cycle, so it clears to '-'.
    // Beat 1 changes from |O-O-| to |--O-|.
    const after = await getPatternNotation(page);
    expect(after["Bass"]).toBe(
      "Bass\n|1---|2---|3---|4---|5---|6---|7---|8---|\n|--O-|XO--|X---|X---|O-O-|XO--|O-XO|--X-|"
    );
  });
});

// --- Pattern Reordering ------------------------------------------------------

test.describe("Pattern reordering", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
  });

  test("drag handles are not shown when locked", async ({ page }) => {
    await expect(page.getByTestId("DragHandleIcon")).not.toBeVisible();
  });

  test("drag handles appear after unlocking", async ({ page }) => {
    await unlock(page);
    await expect(page.getByTestId("DragHandleIcon").first()).toBeVisible();
  });

  test("dragging a pattern changes its position in the list", async ({ page }) => {
    await unlock(page);
    await expect(page.getByTestId("DragHandleIcon").first()).toBeVisible();

    // kuva has 5 patterns in order: k-1(0), k-2(1), lightbulb(2), break(3), squash(4)
    // Drag the second handle (k-2) down past the third (lightbulb).
    const secondHandle = page.getByTestId("DragHandleIcon").nth(1);
    const thirdHandle = page.getByTestId("DragHandleIcon").nth(2);

    const fromBox = await secondHandle.boundingBox();
    const toBox = await thirdHandle.boundingBox();

    // Verify second handle is above third (expected initial order)
    expect(fromBox.y).toBeLessThan(toBox.y);

    const fromX = fromBox.x + fromBox.width / 2;
    const fromY = fromBox.y + fromBox.height / 2;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    // Small move triggers PointerSensor drag activation
    await page.mouse.move(fromX, fromY + 5);
    // Move below the third item to drop k-2 after lightbulb
    await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height);
    await page.mouse.up();

    // After drag: lightbulb should now appear above k-2 in the list.
    // Use toPass to retry until React re-renders the reordered list.
    await expect(async () => {
      const k2Box = await page
        .getByRole("button", { name: "k-2", exact: true })
        .boundingBox();
      const lightbulbBox = await page
        .getByRole("button", { name: "lightbulb", exact: true })
        .boundingBox();
      expect(lightbulbBox.y).toBeLessThan(k2Box.y);
    }).toPass({ timeout: 3000 });
  });
});

// --- Song Title Rename -------------------------------------------------------
//
// The song title is a clickable Button in the TabitBar (onTitleClick is always
// passed in SongView). Clicking it opens a RenameDialog. The rename does NOT
// require unlocking.

test.describe("Song title rename", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
  });

  test("clicking the title opens a rename dialog", async ({ page }) => {
    await page.getByRole("button", { name: KUVA.songName }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Enter new title")).toBeVisible();
  });

  test("confirming a new name updates the app bar title", async ({ page }) => {
    await page.getByRole("button", { name: KUVA.songName }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox").fill("renamed song");
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("button", { name: "renamed song" })).toBeVisible();
    await expect(page.getByRole("button", { name: KUVA.songName })).not.toBeVisible();
  });
});

// --- Add Pattern -------------------------------------------------------------
//
// The AddIcon button appears in the patterns drawer when unlocked.
// Clicking it opens PatternCreateDialog. The "Create new pattern" accordion is
// expanded by default. Typing a name and clicking Confirm adds the pattern,
// selects it, and navigates to it.

test.describe("Add pattern", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
    await unlock(page);
  });

  test("add button is not visible when locked", async ({ page }) => {
    // Load fresh (locked) for this test - unlock was already called in beforeEach,
    // so we reload instead.
    await loadKuva(page);
    await expect(page.getByTestId("AddIcon")).not.toBeVisible();
  });

  test("add button appears after unlocking", async ({ page }) => {
    await expect(page.getByTestId("AddIcon")).toBeVisible();
  });

  test("adding a pattern makes it appear in the pattern list", async ({ page }) => {
    await page.getByTestId("AddIcon").click();
    await expect(page.getByText("Create new pattern")).toBeVisible();

    // Fill the Pattern Name field (first visible one - in the expanded Create accordion)
    await page.getByLabel("Pattern Name").first().fill("my new pattern");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();

    // New pattern should appear in the list
    await expect(page.getByRole("button", { name: "my new pattern", exact: true })).toBeVisible();
  });

  test("newly added pattern is selected and displays an empty grid", async ({ page }) => {
    await page.getByTestId("AddIcon").click();
    await page.getByLabel("Pattern Name").first().fill("brand new");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();

    // The new pattern should be selected (no instrument-parts have notes to show,
    // but hideEmptyParts=true means the grid is empty - 0 instrument-parts visible).
    await expect(page.getByRole("button", { name: "brand new", exact: true })).toBeVisible();
    await expect(page.getByTestId("instrument-part")).toHaveCount(0);
  });
});

// --- Delete Pattern ----------------------------------------------------------
//
// Each pattern list item has an aria-label="delete <name>" button (visible only
// when unlocked). kuva has 5 patterns in display order:
// k-1, k-2, lightbulb, break, squash.

test.describe("Delete pattern", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
  });

  test("delete buttons are not present when locked", async ({ page }) => {
    const patternList = page.getByTestId("pattern-list");
    await expect(patternList.getByRole("button", { name: /^delete / })).toHaveCount(0);
  });

  test("delete buttons appear after unlocking, one per pattern", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");
    await expect(patternList.getByRole("button", { name: /^delete / })).toHaveCount(5);
  });

  test("deleting a pattern removes it from the list", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    await patternList.getByRole("button", { name: "delete k-2" }).click();

    await expect(patternList.getByRole("button", { name: "k-2", exact: true })).not.toBeVisible();
    for (const name of ["k-1", "lightbulb", "break", "squash"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }
    await expect(patternList.getByRole("button", { name: /^delete / })).toHaveCount(4);

    // Still viewing k-1 (the default selection is unaffected by deleting k-2)
    const notation = await getPatternNotation(page);
    for (const [instrument, expectedText] of Object.entries(EXPECTED_NOTATION["k-1"])) {
      expect(notation[instrument]).toBe(instrument + "\n" + expectedText);
    }
  });

  test("app navigates away from deleted pattern", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    // k-1 is selected by default; delete it
    await patternList.getByRole("button", { name: "delete k-1" }).click();

    await expect(patternList.getByRole("button", { name: "k-1", exact: true })).not.toBeVisible();
    for (const name of ["k-2", "lightbulb", "break", "squash"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }
    await expect(patternList.getByRole("button", { name: /^delete / })).toHaveCount(4);

    // App navigated to k-2 (new first pattern)
    const notation = await getPatternNotation(page);
    for (const [instrument, expectedText] of Object.entries(EXPECTED_NOTATION["k-2"])) {
      expect(notation[instrument]).toBe(instrument + "\n" + expectedText);
    }

    // Song title is still shown
    await expect(page.getByRole("button", { name: KUVA.songName })).toBeVisible();
  });

  test("deleting a non-current pattern stays on the current view", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    // Navigate to k-2 first
    await patternList.getByRole("button", { name: "k-2", exact: true }).click();

    // Delete k-1 (not currently viewed)
    await patternList.getByRole("button", { name: "delete k-1" }).click();

    await expect(patternList.getByRole("button", { name: "k-1", exact: true })).not.toBeVisible();
    for (const name of ["k-2", "lightbulb", "break", "squash"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }

    // Still viewing k-2
    const notation = await getPatternNotation(page);
    for (const [instrument, expectedText] of Object.entries(EXPECTED_NOTATION["k-2"])) {
      expect(notation[instrument]).toBe(instrument + "\n" + expectedText);
    }
  });

  test("deleting the last pattern while viewing it navigates to the preceding pattern", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    // Navigate to squash (last pattern)
    await patternList.getByRole("button", { name: "squash", exact: true }).click();

    await patternList.getByRole("button", { name: "delete squash" }).click();

    await expect(patternList.getByRole("button", { name: "squash", exact: true })).not.toBeVisible();
    for (const name of ["k-1", "k-2", "lightbulb", "break"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }

    // App navigated to break (new last pattern)
    const notation = await getPatternNotation(page);
    for (const [instrument, expectedText] of Object.entries(EXPECTED_NOTATION["break"])) {
      expect(notation[instrument]).toBe(instrument + "\n" + expectedText);
    }
  });

  test("deleting the last pattern while not viewing it stays on the current view", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    // Stay on k-1 (default), delete squash
    await patternList.getByRole("button", { name: "delete squash" }).click();

    await expect(patternList.getByRole("button", { name: "squash", exact: true })).not.toBeVisible();
    for (const name of ["k-1", "k-2", "lightbulb", "break"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }

    // Still viewing k-1
    const notation = await getPatternNotation(page);
    for (const [instrument, expectedText] of Object.entries(EXPECTED_NOTATION["k-1"])) {
      expect(notation[instrument]).toBe(instrument + "\n" + expectedText);
    }
  });

  test("deleting a pattern after reordering removes the correct pattern", async ({ page }) => {
    await unlock(page);
    const patternList = page.getByTestId("pattern-list");

    // Drag k-2 (index 1) below lightbulb (index 2).
    // Display order becomes: k-1, lightbulb, k-2, break, squash.
    const secondHandle = page.getByTestId("DragHandleIcon").nth(1);
    const thirdHandle = page.getByTestId("DragHandleIcon").nth(2);
    const fromBox = await secondHandle.boundingBox();
    const toBox = await thirdHandle.boundingBox();
    await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2 + 5);
    await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height);
    await page.mouse.up();

    // Wait for reorder to settle
    await expect(async () => {
      const k2Box = await patternList.getByRole("button", { name: "k-2", exact: true }).boundingBox();
      const lightbulbBox = await patternList.getByRole("button", { name: "lightbulb", exact: true }).boundingBox();
      expect(lightbulbBox.y).toBeLessThan(k2Box.y);
    }).toPass({ timeout: 3000 });

    // Delete lightbulb by name - verifies deletion targets the right pattern regardless of position
    await patternList.getByRole("button", { name: "delete lightbulb" }).click();

    await expect(patternList.getByRole("button", { name: "lightbulb", exact: true })).not.toBeVisible();
    for (const name of ["k-1", "k-2", "break", "squash"]) {
      await expect(patternList.getByRole("button", { name, exact: true })).toBeVisible();
    }
    await expect(patternList.getByRole("button", { name: /^delete / })).toHaveCount(4);
  });
});
