# TODO

## Cleanup

- [ ] **Investigate removing `Track.js`** - `SparseTrack` appears to be the primary representation, but `Track` is still referenced in `h2.js` (parsing), `ToneController.js` (converts to dense for playback), `SongLoaders.js` (conversion step), and `notation.js`. Check whether these usages can be migrated to `SparseTrack` or are genuinely load-bearing.

---

## Unit Tests

Coverage gaps - all pure logic, straightforward Jest tests.

- [ ] **`SparseTrack.js`** - completely untested. Key methods: `queryPoint`, `setPoint`, `findAllInRange`, `findPVInRange`, `countInRange`, `getResolution`, `aggregate`, `combineConsecutive`
- [ ] **`utilities.js`** - `calculateResolution`, `findHCF`, `zip` - implicitly exercised but deserve their own tests
- [ ] **`Audio.js`** - `determineMinResolution`, `determineTrackLength`, `convertNormalToAudible`/`convertAudibleToNormal` (volume curve is worth boundary-testing)
- [ ] **`notation.js`** - main functions untested: `formatPatternString`, `formatPatternStringSparse`, `clonePattern`, `createEmptyPattern`, `createResizedPattern`. The `fromInstrumentAndTrack()` entry point has a FIXME in the existing test file.
- [ ] **`SongStorage.js`** - `encodeState`/`decodeState` round-trip; localStorage save/restore with mocked storage

---

## E2E Tests (Playwright)

### Infrastructure

- [x] **JSONBin mock** - `e2e/fixtures/jsonbin.js`: `mockJsonBinShare`, `mockJsonBinLoad`, `mockJsonBinFailure` helpers using `page.route()`. Ready to use in share/URL round-trip tests.

### Settings

`notation-settings.spec.js` covers: `restMark`, `numberRestMark`, `showBeatMark`, `showBeatNumbers`, `hideEmptyParts`, `smartTupletFormatting`, `compactDisplay`. Gaps:

- [x] **`undefinedMark`** - tested in `notation-settings.spec.js`: change from "3" to "#" with `smartTupletFormatting:false` to expose off-grid notes.
- [x] **`hideMutedParts`** - tested in `notation-settings.spec.js`: load kuva with Bass muted, verify 4 vs 5 instrument-parts.
- [ ] **`expandRepeatedLines`** - needs a pattern with repeated lines. May need dedicated test data.
- [x] **`lineResolution` (Pattern tab)** - tested in `settings-pattern-tab.spec.js`: change 8 beats/line to 4, verify notation reflows (note: `expandRepeatedLines:false` suppresses the beat-number header on the second line).
- [ ] **`beatResolution` (Pattern tab)** - interacts with `lineResolution`; best with a non-standard time signature.
- [ ] **`primaryResolution` (Pattern tab)** - needs a pattern with notes at multiple sub-beat resolutions.
- [ ] **`useIndividualResolution` / `individualResolutions` (Pattern tab)** - per-instrument resolution override. Needs instruments at different native resolutions.
- [x] **`showHelp` toggle** - tested in `notation-settings.spec.js`: toggle off/on, verify Switch checked state.
- [x] **Tempo slider** - tested in `settings-pattern-tab.spec.js`: ArrowRight/Left change `aria-valuenow`.
- [ ] **Per-instrument volume** - changing the volume slider in `InstrumentConfig` persists in downloaded `.tabit` and reloads correctly.

### Editing

- [x] **Rename song title** - tested in `editing.spec.js`: click title button, fill RenameDialog, assert new title in app bar.
- [x] **Add a new pattern** - tested in `editing.spec.js`: AddIcon button opens PatternCreateDialog, new pattern appears and renders empty grid.
- [x] **Delete a pattern** - tested in `editing.spec.js`: DeleteIcon (4 tests: locked/unlocked state, removal from list, navigation after delete).
- [ ] **Share URL round-trip** - encode state to a share URL via JSONBin mock, reload from URL, same song appears. Depends on JSONBin mock (done).

### Data Import

- [ ] **Varied time signatures** - import `.h2song` files in 3/4, 5/4, 6/8, 7/8; assert correct pattern length, beat count, and line layout.
- [ ] **Irregular / mixed patterns** - song where patterns have different lengths (e.g. 2-bar break + 4-bar verse). Each pattern should render with the correct length independently.
- [ ] **Triplet content** - patterns with genuine triplet subdivisions (not just `smartTupletFormatting` artefacts). Assert round-trip through import without data loss.
- [ ] **Instrument categorisation** - assert correct category (djembe, snare, shaker, etc.) across a range of drumkit files with varied naming conventions.
- [ ] **Virtual pattern resolution** - Hydrogen's pattern-in-pattern feature is correctly expanded on import. Needs a `.h2song` that exercises this as test data.
- [ ] **Multi-line notation** - verify that patterns long enough to span multiple display lines render correctly: first line has beat numbers, subsequent lines show notes only (`expandRepeatedLines:false` default); toggling `expandRepeatedLines:true` restores headers on all lines. Good candidates in the existing test data (longer patterns from `that_guy`, `too_much_garlic`, etc.).

### Playback

Audio output is out of scope - assert on UI state only. Strategy for beat-marker animation needs discussion before writing tests.

- [ ] Play button starts playback (playing state, stop button appears)
- [ ] Stop button halts playback
- [ ] Beat marker animation advances through the pattern (timing/flakiness strategy TBD)

---

## Project Next Steps

- [ ] **Migrate away from CRA** - Create React App is unmaintained and blocks modern tooling. Recommended replacement is Vite (fast dev server, native ESM, smaller output). Key risks: `react-app-rewired` config overrides need porting; the `build:e2e` `PUBLIC_URL` workaround may need revisiting under a new bundler.
- [ ] **In-app documentation and help** - the `showHelp` toggle in the SettingsDrawer already provides a hook, but coverage is sparse. Decide on scope: tooltips on all controls, a dedicated help panel, or a short guided tour for first-time users.
