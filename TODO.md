# TODO

## Cleanup

- [ ] **Investigate removing `Track.js`** - `SparseTrack` appears to be the primary representation, but `Track` is still referenced in `h2.js` (parsing), `ToneController.js` (converts to dense for playback), `SongLoaders.js` (conversion step), and `notation.js`. Check whether these usages can be migrated to `SparseTrack` or are genuinely load-bearing.

---

## Unit Tests

Coverage gaps identified by audit. All of these are pure logic with no side effects - straightforward Jest tests.

- [ ] **`SparseTrack.js`** - completely untested. Key methods: `queryPoint`, `setPoint`, `findAllInRange`, `findPVInRange`, `countInRange`, `getResolution`, `aggregate`, `combineConsecutive`
- [ ] **`utilities.js`** - `calculateResolution`, `findHCF`, `zip` - implicitly exercised but deserve their own tests
- [ ] **`Audio.js`** - `determineMinResolution`, `determineTrackLength`, `convertNormalToAudible`/`convertAudibleToNormal` (volume curve is worth boundary-testing)
- [ ] **`notation.js`** - main functions untested: `formatPatternString`, `formatPatternStringSparse`, `clonePattern`, `createEmptyPattern`, `createResizedPattern`. The `fromInstrumentAndTrack()` entry point has a FIXME in the existing test file.
- [ ] **`SongStorage.js`** - `encodeState`/`decodeState` round-trip deserves a test; localStorage save/restore can be tested with mocked storage

---

## E2E Tests (Playwright)

### Setup

- [ ] Add `serve` and `@playwright/test` as dev dependencies
- [ ] Create `e2e/` directory for test files (separate from Jest tests in `src/__tests__/`)
- [ ] Configure `playwright.config.js`:
  - In CI (`process.env.CI`): serve the built app with `serve -s build`
  - In dev: reuse an already-running `yarn start` if available, otherwise start one
  - `reuseExistingServer: !process.env.CI` handles this cleanly
- [ ] Add `yarn e2e` script to `package.json`
- [ ] Add Playwright step to `.github/workflows/build.yml` (after the build step)

### Test Infrastructure

#### Storage abstraction (app refactor - prerequisite for storage-related tests)

- [ ] Introduce a `StorageProvider` abstraction - components currently call `window.localStorage` directly (primarily `SongStorage.js` and `SongView.js`). Refactor these to call through a provider interface instead.
- [ ] In production, the provider is a thin wrapper around `window.localStorage` - no behaviour change.
- [ ] In tests, swap in an instrumented provider that records all `get`, `set`, and `remove` calls, and allows seeding initial state. This lets tests assert not just *what* is in storage but *that* and *when* a component wrote to it.
- [ ] This is a meaningful refactor of `SongStorage.js` and `SongView.js` - scope carefully before starting.

#### JSONBin mock

- [ ] Implement a reusable Playwright fixture that intercepts requests to the JSONBin API via `page.route()` and returns canned responses.
- [ ] Fixture should support: simulating a successful share (returns a fake URL), simulating a successful load (returns a seeded song), and simulating failure (for error-handling tests).

#### Playwright fixtures

- [ ] Wrap both the storage provider and JSONBin mock as Playwright fixtures so tests declare dependencies cleanly rather than wiring mocks manually per test.

---

### Suite 1 - Basic Functionality

- Title screen renders without crashing
- Built-in example song loads and pattern displays correctly
- Navigate between patterns in the example song - each displays correctly
- Import a `.h2song` file - pattern renders correctly

### Suite 2 - Playback

Audio output is out of scope. Strategy needs discussion - likely asserting on UI state changes rather than audio.

- Play button starts playback (UI enters playing state, stop button becomes available)
- Stop button halts playback
- Playback highlight (beat marker animation) advances through the pattern - needs strategy discussion (timing, what to assert on, flakiness risk)

### Suite 3 - Data Import

More rigorous than the basic import smoke test in Suite 1. Needs test data discussion.

- Import a variety of `.h2song` files and assert correct pattern structure (instrument names, note counts, pattern count)
- Instrument parsing/detection sub-suite: assert that instruments are correctly categorised (djembes, snares, shakers, etc.) for a range of real drumkit files
- Virtual pattern resolution (Hydrogen's pattern-in-pattern feature) is correctly expanded on import

### Suite 4 - Settings

All controls in the SettingsPanel apply correctly. Needs articulation of which settings are testable via visible output.

- Each format setting (notation style, line resolution, beat markers, etc.) produces the expected change in the rendered pattern
- Settings persist across pattern navigation
- Test against a variety of songs to catch instrument-specific edge cases

### Suite 5 - Instrument Config

- InstrumentConfig panel opens correctly
- Instruments can be renamed, reordered, muted
- Changes are reflected in the pattern display
- Needs discussion on test data - some songs have complex instrument setups

### Suite 6 - Editing Functionality

- Toggle a note on/off - notation updates correctly
- Rename a pattern
- Add a new pattern
- Delete a pattern
- Reorder patterns (drag-and-drop)
- Sharing URL round-trip - encode state into URL, reload, same song appears

### Suite 7 - Title Screen & Storage

- Static songbooks are listed and a song can be opened from one
- Recently opened songs appear in the recent songs list
- Autosave: song state is preserved across page reload (localStorage persistence)
- Autosave: recent song list is updated after opening/editing a song
