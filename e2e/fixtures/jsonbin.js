// @ts-check
// Helpers for mocking JSONBin API calls in Playwright tests.
//
// SongStorage.js uses two JSONBin endpoints:
//   POST https://api.jsonbin.io/v3/b              → create bin, returns {metadata:{id}}
//   GET  https://api.jsonbin.io/v3/b/{id}/latest  → read bin, returns {record: encodedState}
//
// SongStorage.encodeState: JSON.stringify(song) → Node zlib deflate → base64 → {state: base64}
// SongStorage.decodeState: base64 → inflate → JSON.parse

const zlib = require("zlib");

const JSONBIN_POST_URL = "https://api.jsonbin.io/v3/b";

// Replicates SongStorage.encodeState for use in mock responses.
function encodeStateForMock(songData) {
  const compressed = zlib.deflateSync(JSON.stringify(songData)).toString("base64");
  return { state: compressed };
}

// Route the JSONBin POST (share/create) to return a canned bin ID.
async function mockJsonBinShare(page, fakeBinId = "fake-bin-test-123") {
  await page.route(JSONBIN_POST_URL, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ metadata: { id: fakeBinId } }),
    });
  });
}

// Route the JSONBin GET (load) for a specific bin ID to return the given song data.
async function mockJsonBinLoad(page, fakeBinId, songData) {
  const record = encodeStateForMock(songData);
  await page.route(
    `https://api.jsonbin.io/v3/b/${fakeBinId}/latest`,
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ record }),
      });
    }
  );
}

// Route all JSONBin calls to return 500 errors, for error-handling tests.
async function mockJsonBinFailure(page) {
  await page.route(/https:\/\/api\.jsonbin\.io\/v3\/b/, (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });
}

module.exports = { encodeStateForMock, mockJsonBinShare, mockJsonBinLoad, mockJsonBinFailure };
