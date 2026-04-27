// @ts-check
// Tests for editing interactions: note toggling and pattern reordering.
//
// Both features require the song to be unlocked (locked=true on load).
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
  await expect(page.getByText(KUVA.songName)).toBeVisible();
}

async function unlock(page) {
  await page.getByTestId("LockIcon").click();
  await expect(page.getByTestId("LockOpenIcon")).toBeVisible();
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
