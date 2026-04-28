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
  await expect(page.getByRole("button", { name: "Lock editing" })).toBeVisible();
}

// ─── Note Toggling ───────────────────────────────────────────────────────────

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

    const firstPart = page.getByTestId("instrument-part").first();
    const initialText = await firstPart.innerText();

    await firstPart.locator(".hoverableNote").first().click();

    const updatedText = await firstPart.innerText();
    // TODO: Add a test for the entirety of what this *should* be *before* and *after*
    // not just that "it has changed"
    expect(updatedText).not.toBe(initialText);
  });
});

// ─── Pattern Reordering ──────────────────────────────────────────────────────

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

// ─── Song Title Rename ───────────────────────────────────────────────────────
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

// ─── Add Pattern ─────────────────────────────────────────────────────────────
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
    await expect(page.getByRole("button", { name: "my new pattern" })).toBeVisible();
  });

  test("newly added pattern is selected and displays an empty grid", async ({ page }) => {
    await page.getByTestId("AddIcon").click();
    await page.getByLabel("Pattern Name").first().fill("brand new");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();

    // The new pattern should be selected (no instrument-parts have notes to show,
    // but hideEmptyParts=true means the grid is empty - 0 instrument-parts visible).
    await expect(page.getByRole("button", { name: "brand new" })).toBeVisible();
    await expect(page.getByTestId("instrument-part")).toHaveCount(0);
  });
});

// ─── Delete Pattern ──────────────────────────────────────────────────────────
//
// DeleteIcon (ClearIcon from @mui/icons-material/Delete) appears next to each
// pattern in the drawer when unlocked. kuva has 5 patterns in display order:
// k-1, k-2, lightbulb, break, squash.

test.describe("Delete pattern", () => {
  test.beforeEach(async ({ page }) => {
    await loadKuva(page);
  });

  test("delete icons are not visible when locked", async ({ page }) => {
    // TODO: Look for a delete role / test-id rather than DeleteIcon in MUI
    await expect(page.getByTestId("DeleteIcon").first()).not.toBeVisible();
  });

  test("delete icons appear after unlocking", async ({ page }) => {
    await unlock(page);
    // TODO: Look for a delete role / test-id rather than DeleteIcon in MUI
    await expect(page.getByTestId("DeleteIcon").first()).toBeVisible();
    await expect(page.getByTestId("DeleteIcon")).toHaveCount(5);
  });

  // TODO: Test deletion behaviour when patterns have been reordered

  test("deleting a pattern removes it from the list", async ({ page }) => {
    await unlock(page);

    // Delete k-2 (index 1 in display order)
    await page.getByTestId("DeleteIcon").nth(1).click();

    // TODO: Restrict search for the pattern widget to at least within the PatternDrawer
    await expect(page.getByRole("button", { name: "k-2", exact: true })).not.toBeVisible();
    // 4 patterns remain
    // TODO: Test the the list of visible patterns is exactly as expected
    // TODO: Verify shown pattern notation is as expected, code from example-song.spec.js
    // could be refactored to support this
    await expect(page.getByTestId("DeleteIcon")).toHaveCount(4);
  });

  // TODO: Test behaviour when deleting the last pattern in the list (when currently viewing/when not currently viewing)
  // TODO: Test behaviour when deleting the first pattern in the last (when currently viewing/when not currently viewing)
  test("app navigates away from deleted pattern", async ({ page }) => {
    await unlock(page);

    // k-1 is selected by default. Delete k-1 (index 0).
    await page.getByTestId("DeleteIcon").nth(0).click();

    // TODO: Restrict search for the pattern widget (k-1) to at least within the PatternDrawers
    // App should navigate to another pattern (k-2 or whichever is now first)
    await expect(page.getByRole("button", { name: "k-1", exact: true })).not.toBeVisible();
    // The song title is still shown (song is still loaded)
    // TODO: Test the the list of visible patterns is exactly as expected
    // TODO: Verify shown pattern notation is as expected, code from example-song.spec.js
    // could be refactored to support this
    await expect(page.getByRole("button", { name: KUVA.songName })).toBeVisible();
  });
});
