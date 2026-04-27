// @ts-check
// Tests for localStorage history: what the title screen shows, and what the
// song view writes when navigating away.
//
// Each Playwright test gets a fresh browser context so localStorage starts empty.
// seedHistory() must be called before page.goto() to take effect.

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { makeHistoryEntry, seedHistory, readHistory } = require("./storage-helpers");

const KUVA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../test_data/kuva.tabit"), "utf8"),
);

// Load kuva.tabit from the title screen, navigating to /import.
// Resolves once the song title is visible in the app bar.
async function importKuva(page, overrides = {}) {
  const modified = { ...KUVA, ...overrides };
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.tabit",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(modified)),
  });
  await expect(page.getByText(modified.songName ?? KUVA.songName)).toBeVisible();
}

// Navigate from the song view back to the title screen using the in-app home
// button. This is a React Router navigation so componentWillUnmount fires and
// onSave writes to localStorage before TitleScreen.componentDidMount reads it.
async function goHome(page) {
  await page.getByTestId("HomeIcon").click();
  await expect(page.getByRole("heading", { name: "tabit" })).toBeVisible();
}

// ─── Title Screen Display ────────────────────────────────────────────────────

test.describe("Title screen - history display", () => {
  test("shows no recent-songs section when history is empty", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Recent Songs")).not.toBeVisible();
  });

  test("shows recent songs when history is non-empty", async ({ page }) => {
    const entries = [
      makeHistoryEntry({ ...KUVA, songName: "Song Alpha" }, { date: 1000 }),
      makeHistoryEntry({ ...KUVA, songName: "Song Beta" }, { date: 2000 }),
    ];
    await seedHistory(page, entries);
    await page.goto("/");

    await expect(page.getByText("Recent Songs")).toBeVisible();
    await expect(page.getByText("Song Alpha")).toBeVisible();
    await expect(page.getByText("Song Beta")).toBeVisible();
  });

  test("lists songs most-recent first", async ({ page }) => {
    const entries = [
      makeHistoryEntry({ ...KUVA, songName: "Older Song" }, { date: 1000 }),
      makeHistoryEntry({ ...KUVA, songName: "Newer Song" }, { date: 9000 }),
    ];
    await seedHistory(page, entries);
    await page.goto("/");

    // Wait for both to render, then compare vertical positions.
    await expect(page.getByText("Newer Song")).toBeVisible();
    await expect(page.getByText("Older Song")).toBeVisible();
    const newerBox = await page.getByText("Newer Song").boundingBox();
    const olderBox = await page.getByText("Older Song").boundingBox();
    expect(newerBox.y).toBeLessThan(olderBox.y);
  });

  test("clicking a recent song loads it", async ({ page }) => {
    const entry = makeHistoryEntry(KUVA);
    await seedHistory(page, [entry]);
    await page.goto("/");

    await page.getByText(KUVA.songName).click();
    await expect(page.getByText(KUVA.songName)).toBeVisible();
    // Confirm we landed in the song view, not still on the title screen
    await expect(page.getByTestId("LockIcon")).toBeVisible();
  });

  test("clicking a corrupted history entry redirects home with an error dialog", async ({
    page,
  }) => {
    // Make a valid entry then corrupt the content so the hash check fails.
    // LocalStorageSongView checks hash(song.content) === songID and throws
    // "Hash did not match" when they differ, which redirects to "/" with an error.
    const entry = makeHistoryEntry(KUVA);
    entry.content = { state: "corrupted" };
    await seedHistory(page, [entry]);
    await page.goto("/");

    await page.getByText(KUVA.songName).click();

    // App redirects to "/" and TitleScreen shows the error dialog
    await expect(page.getByText("Something went wrong.")).toBeVisible();
    await expect(page.getByText(/Failed to load recently viewed song/)).toBeVisible();
  });
});

// ─── SongView History Writes ─────────────────────────────────────────────────

test.describe("SongView - writing to history", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("navigating away from an imported file saves it to history", async ({
    page,
  }) => {
    await importKuva(page);
    await goHome(page);

    const history = await readHistory(page);
    expect(history).toHaveLength(1);
    expect(history[0].name).toBe(KUVA.songName);
  });

  test("importing the same file twice produces one history entry", async ({
    page,
  }) => {
    await importKuva(page);
    await goHome(page);

    // Import the identical file a second time
    await importKuva(page);
    await goHome(page);

    const history = await readHistory(page);
    expect(history).toHaveLength(1);
  });

  test("same song name but different content produces two history entries", async ({
    page,
  }) => {
    // First import: default kuva settings
    await importKuva(page);
    await goHome(page);

    // Second import: same songName, one setting changed - different hash
    await importKuva(page, {
      formatSettings: { ...KUVA.formatSettings, showBeatNumbers: false },
    });
    await goHome(page);

    const history = await readHistory(page);
    expect(history).toHaveLength(2);
    expect(history.every((e) => e.name === KUVA.songName)).toBe(true);
  });
});
