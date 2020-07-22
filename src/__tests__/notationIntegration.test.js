// notationIntegration.test.js

import fs from "fs"

import notation from "../notation"
import track from "../track"

function formatAsPage(state, instruments, config = {})
{
  let page = "";
  for( const track of state.patterns )
  {
    const name = track.name;
    page += name + "\n\n";
    for( const [instrumentName, instrument] of instruments )
    {
      const notationString = notation.fromInstrumentAndTrack(
        instrument,
        track.instrumentTracks,
        config
      );
      page += instrumentName + "\n\n";
      page += notationString + "\n\n";
    }
  }
  return page;
}

function createObjects(state)
{
  // the instruments currently work as simple objects
  // we need to create tracks!
  for( let pattern of state.patterns )
  {
    let replacedTracks = {};
    // todo: find a more compact way of doing this
    for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
    {
      replacedTracks[id] = new track( trackData.rep, trackData.resolution );
    }
    pattern.instrumentTracks = replacedTracks;
  }
  return state;
}

// andy instrument mapping
const configuredInstrumentMappings = [
  ["Bottom Bass", {"0" : "O", "18" : "X"}],
  ["Mid Bass", {"1" : "X", "17" : "O"}], 
  ["Shaker", {"16" : "x", "21" : "X"}],
  ["Snare", {"2" : "X", "13" : "-"}], 
  ["Djembe", {"10" : "S", "11" : "t", "12" : "O"}]
];

test('notation separate garlic', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json")));
  const instrumentMappings = Array.from(
    Object.entries(state.instruments),
    (idAndObj) => [ idAndObj[1].name, { [idAndObj[0].toString()]: "X" } ]
  );
  const output = formatAsPage( state, instrumentMappings );
  expect(output).toMatchSnapshot();
});

test('notation separate kuva', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/kivakovakivikuva.json")));
  const instrumentMappings = Array.from(
    Object.entries(state.instruments),
    (idAndObj) => [ idAndObj[1].name, { [idAndObj[0].toString()]: "X" } ]
  );
  const output = formatAsPage( state, instrumentMappings );
  expect(output).toMatchSnapshot();
});

test('notation garlic', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json")));
  const output = formatAsPage( state, configuredInstrumentMappings );
  expect(output).toMatchSnapshot();
});

test('notation kuva', () => {
  let state = createObjects(JSON.parse(fs.readFileSync("./test_data/kivakovakivikuva.json")));
  const output = formatAsPage( state, configuredInstrumentMappings );
  expect(output).toMatchSnapshot();
});

// note, this wouldn't quite be figured out by our instrument logic
// we would get 1 snare, and the tom and the click would be separate

const cumulusInstrumentMappings = [
  ["Bass", {"0" : "O", "1" : "X"}],
  ["Snare 1", { "2" : "X"}],
  ["Snare 2", { "4" : "X"}],
  ["Tom", {"5" : "O", "3" : "X"}] 
];

test('notation cumulus', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/cumulus.json")));
  const output = formatAsPage( state, cumulusInstrumentMappings );
  expect(output).toMatchSnapshot();
});


const thatGuyInstrumentMappings = [
  ["Bottom Bass ", {"0" : "O", "1" : "X"}],
  ["Mid Bass", {"6" : "O", "8" : "X"}],
  ["Djembe", {"2" : "S", "3" : "t", "4" : "O"}],
  ["Shaker", {"5" : "X"}],
  ["Snare", {"7" : "X", "9" : "-"}],
];

test('notation that_guy', () => {
  let state = createObjects(JSON.parse(fs.readFileSync("./test_data/that_guy.json")));
  const output = formatAsPage( state, thatGuyInstrumentMappings );
  expect(output).toMatchSnapshot();
});
