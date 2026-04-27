// @ts-check
// Tests for the InstrumentConfig table: locked/unlocked state, rename, symbol,
// sample, mute, add, delete, and track reassignment.
//
// Fixture: bfs_drumkit_rbw4.h2song - a BFS-style h2song with standard instrument
// names (Bass, Tom, Snare, Shaker, Djembe). Single pattern "Main".
// Song title shown in the app bar comes from the filename: "bfs_drumkit_rbw4".
//
// InstrumentTable layout:
//   Top table:    one column per instrument (rename via EditIcon, mute/volume widget)
//   Bottom table: appears when the expand chevron is clicked:
//                 - thead: one column per track (symbol/sample via EditIcon, mute/volume)
//                 - tbody: reassignment checkbox matrix + add/delete rows (unlocked only)

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const BFS_FILE = fs.readFileSync(
  path.join(__dirname, "../test_data/bfs_drumkit_rbw4.h2song"),
);

async function loadBFS(page) {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "bfs_drumkit_rbw4.h2song",
    mimeType: "text/xml",
    buffer: BFS_FILE,
  });
  await expect(page.getByText("bfs_drumkit_rbw4")).toBeVisible();
}

async function unlock(page) {
  await page.getByTestId("LockIcon").click();
  await expect(page.getByTestId("LockOpenIcon")).toBeVisible();
}

// Show the track columns (and, when unlocked, the reassignment matrix).
async function expandTable(page) {
  await page.getByTestId("KeyboardArrowDownIcon").click();
  await expect(page.getByTestId("KeyboardArrowUpIcon")).toBeVisible();
}

// Download the current song and return the parsed .tabit JSON.
async function downloadSong(page) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("SaveAltIcon").click();
  const download = await downloadPromise;
  return JSON.parse(fs.readFileSync(await download.path(), "utf8"));
}

const instrumentTable = (page) => page.getByRole("table").first();
const trackTable = (page) => page.getByRole("table").nth(1);

// ─── Locked / Unlocked State ────────────────────────────────────────────────

test.describe("InstrumentConfig - locked state", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
  });

  test("shows instrument edit controls in the header", async ({ page }) => {
    await expect(
      instrumentTable(page).locator("thead").getByTestId("EditIcon").first(),
    ).toBeVisible();
  });

  test("shows the expand chevron for the track section", async ({ page }) => {
    await expect(page.getByTestId("KeyboardArrowDownIcon")).toBeVisible();
  });

  test("does not show add or delete instrument controls", async ({ page }) => {
    await expect(page.getByTestId("AddBoxIcon")).not.toBeVisible();
    await expect(page.getByTestId("ClearIcon")).not.toBeVisible();
  });

  test("expanding shows track edit controls but not the reassignment matrix", async ({
    page,
  }) => {
    await expandTable(page);
    await expect(
      trackTable(page).locator("thead").getByTestId("EditIcon").first(),
    ).toBeVisible();
    await expect(page.getByRole("checkbox")).not.toBeVisible();
    await expect(page.getByTestId("AddBoxIcon")).not.toBeVisible();
  });
});

test.describe("InstrumentConfig - unlocked state", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
    await unlock(page);
  });

  test("expanding shows the reassignment matrix, add, and delete controls", async ({
    page,
  }) => {
    await expandTable(page);
    await expect(page.getByRole("checkbox").first()).toBeVisible();
    await expect(page.getByTestId("AddBoxIcon")).toBeVisible();
    await expect(page.getByTestId("ClearIcon").first()).toBeVisible();
  });
});

// ─── Rename Instrument ───────────────────────────────────────────────────────

test.describe("Rename instrument", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
  });

  test("renaming an instrument updates the notation heading", async ({ page }) => {
    const firstPart = page.getByTestId("instrument-part").first();
    const originalName = (await firstPart.locator("h4").innerText()).trim();

    await instrumentTable(page)
      .locator("thead")
      .getByTestId("EditIcon")
      .first()
      .click();

    await page.getByRole("textbox").fill("Renamed");
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(firstPart.locator("h4")).toHaveText("Renamed");
    await expect(firstPart.locator("h4")).not.toHaveText(originalName);
  });
});

// ─── Edit Symbol ─────────────────────────────────────────────────────────────

test.describe("Edit symbol", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
  });

  test("changing a track symbol is reflected in the notation", async ({ page }) => {
    await expandTable(page);

    await trackTable(page)
      .locator("thead")
      .getByTestId("EditIcon")
      .first()
      .click();
    await page.getByRole("button", { name: "Edit Symbol" }).click();

    await page.getByRole("textbox").fill("Z");
    await page.getByRole("button", { name: "Confirm" }).click();

    // The first track belongs to the first instrument; its notes should now render as "Z".
    await expect(
      page.getByTestId("instrument-part").first(),
    ).toContainText("Z");
  });
});

// ─── Edit Sample ─────────────────────────────────────────────────────────────

test.describe("Edit sample", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
  });

  test("changing a track sample is reflected in the export", async ({ page }) => {
    await expandTable(page);

    await trackTable(page)
      .locator("thead")
      .getByTestId("EditIcon")
      .first()
      .click();
    await page.getByRole("button", { name: "Edit Sample" }).click();

    // Change to the second drumkit in the list.
    // bfs_drumkit_rbw4's first track uses "BFS drumming" (index 0);
    // index 1 is "BFS drumming - Beasties 2024".
    const dialog = page.getByRole("dialog");
    await dialog.locator('[aria-haspopup="listbox"]').first().click();
    await page.getByRole("option").nth(1).click();

    await page.getByRole("button", { name: "Confirm" }).click();

    const exported = await downloadSong(page);
    expect(exported.instrumentIndex[0].drumkit).not.toBe("BFS drumming");
  });
});

// ─── Mute Instrument ─────────────────────────────────────────────────────────

test.describe("Mute instrument", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
  });

  test("muting an instrument shows the muted icon", async ({ page }) => {
    // bfs_drumkit_rbw4 instruments start with volume 1.0 → VolumeUpIcon shown initially.
    await instrumentTable(page)
      .locator("thead")
      .getByTestId("VolumeUpIcon")
      .first()
      .click();
    await expect(
      instrumentTable(page).locator("thead").getByTestId("VolumeOffIcon").first(),
    ).toBeVisible();
  });

  test("mute state is reflected in the export", async ({ page }) => {
    await instrumentTable(page)
      .locator("thead")
      .getByTestId("VolumeUpIcon")
      .first()
      .click();
    const exported = await downloadSong(page);
    // instruments is [[name, symbols, ..., {muted, volume}], ...]
    expect(exported.instruments[0][3].muted).toBe(true);
  });
});

// ─── Delete Instrument ───────────────────────────────────────────────────────

test.describe("Delete instrument", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
    await unlock(page);
    await expandTable(page);
  });

  test("deleting an instrument removes it from the notation", async ({ page }) => {
    const firstPart = page.getByTestId("instrument-part").first();
    const deletedName = (await firstPart.locator("h4").innerText()).trim();

    await trackTable(page)
      .locator("tbody")
      .getByTestId("ClearIcon")
      .first()
      .click();

    await expect(
      page
        .getByTestId("instrument-part")
        .filter({ has: page.locator("h4", { hasText: deletedName }) }),
    ).not.toBeVisible();
  });
});

// ─── Add Instrument ──────────────────────────────────────────────────────────

test.describe("Add instrument", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
    await unlock(page);
    await expandTable(page);
  });

  test("adding an instrument makes it appear in the instrument table header", async ({
    page,
  }) => {
    await page.getByTestId("AddBoxIcon").click();
    await page.getByRole("textbox").fill("NewInst");
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      instrumentTable(page).locator("thead").getByText("NewInst"),
    ).toBeVisible();
  });
});

// ─── Track Reassignment ──────────────────────────────────────────────────────

test.describe("Track reassignment", () => {
  test.beforeEach(async ({ page }) => {
    await loadBFS(page);
    await unlock(page);
    await expandTable(page);
  });

  test("reassigning a track changes its checked row in the matrix", async ({
    page,
  }) => {
    // Each body row is an instrument; each checkbox column is a track.
    // Track 0 starts assigned to instrument 0 (first row checked, second unchecked).
    const rows = trackTable(page).locator("tbody tr");
    const firstRowTrack0 = rows.first().getByRole("checkbox").first();
    const secondRowTrack0 = rows.nth(1).getByRole("checkbox").first();

    await expect(firstRowTrack0).toBeChecked();
    await expect(secondRowTrack0).not.toBeChecked();

    await secondRowTrack0.click();

    await expect(firstRowTrack0).not.toBeChecked();
    await expect(secondRowTrack0).toBeChecked();
  });
});
