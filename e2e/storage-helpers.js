// Node-side utilities for seeding and reading the tabit localStorage history.
//
// Mirrors the encode/hash logic in SongStorage.js so that seeded entries are
// indistinguishable from entries written by the app itself.

const zlib = require("zlib");
// object-hash is a runtime dependency of tabit; use the same package so that
// hashes computed here match hashes the browser code produces.
const objectHash = require("object-hash");

// Mirrors SongStorage.encodeState.
function encodeState(songData) {
  const compressed = zlib.deflateSync(JSON.stringify(songData)).toString("base64");
  return { state: compressed };
}

// Creates a history entry in the same format that saveToLocalHistory writes.
// songData must have a songName field.
// Pass overrides to fix the date or id (e.g. for ordering tests).
function makeHistoryEntry(songData, overrides = {}) {
  const content = encodeState(songData);
  const id = objectHash(content);
  return {
    name: songData.songName,
    id,
    hash: id,
    songID: id,
    date: Date.now(),
    content,
    ...overrides,
  };
}

// Seeds localStorage["tabit-history"] before the page's JavaScript runs.
// Must be called before page.goto().
async function seedHistory(page, entries) {
  await page.addInitScript((json) => {
    localStorage.setItem("tabit-history", json);
  }, JSON.stringify(entries));
}

// Reads and returns the raw history array from localStorage, or [] if absent.
async function readHistory(page) {
  return page.evaluate(() => {
    const json = localStorage.getItem("tabit-history");
    return json ? JSON.parse(json) : [];
  });
}

// Mirrors the inverse of encodeState - decodes a history entry's content back to song data.
function decodeState(content) {
  return JSON.parse(zlib.inflateSync(Buffer.from(content.state, "base64")).toString("utf8"));
}

module.exports = { encodeState, decodeState, makeHistoryEntry, seedHistory, readHistory };
