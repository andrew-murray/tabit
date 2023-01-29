// instrumentIntegration.test.js

import fs from "fs"
import Track from "../Track"
import SparseTrack from "../SparseTrack"
import { DEFAULT_INSTRUMENT_SYMBOLS, figureClickyInstruments, figureDjembes, figureInstruments, figureShakers, figureSnares } from "../instrumentation"


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
      if("rep" in trackData)
      {
        replacedTracks[id] = new Track( trackData.rep, trackData.resolution );
      }
      else
      {
        replacedTracks[id] = new SparseTrack( trackData.points, trackData.length_, trackData.velocity );
      }
    }
    pattern.instrumentTracks = replacedTracks;
  }
  return state;
}

test('instrumentation garlic - djembes', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const djembes = figureDjembes( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctDjembes = [
    [
      "Djembe", {
        "10" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Slap"],
        "11" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Tone"],
        "12" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Bass"]
      }
    ]
  ];
  expect(djembes).toEqual(correctDjembes);
});

test('instrumentation garlic - shakers', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const shakers = figureShakers( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctShakers = [
    [
      "Shaker", {
        "16" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Ghost"],
        "21" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Accent"]
      }
    ]
  ];
  expect(shakers).toEqual(correctShakers);
});

test('instrumentation garlic - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctSnares = [
    [
      "Snare", {
        "13" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"],
        "2" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    ]
  ];
  expect(snares).toEqual(correctSnares);
});

test('instrumentation - that_guy - djembes', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const djembes = figureDjembes( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctDjembes = [
    [
      "Djembe", {
        "10" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Slap"],
        "11" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Tone"],
        "12" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Bass"]
      }
    ]
  ];
  expect(djembes).toEqual(correctDjembes);
});

test('instrumentation - that_guy - shakers', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/that_guy.json"));
  const shakers = figureShakers( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctShakers = [
    [
      "Shaker", {
        "5" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Accent"]
      }
    ]
  ];
  expect(shakers).toEqual(correctShakers);
});

test('instrumentation - that_guy - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/that_guy.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctSnares = [
    [
      "Snare", {
        "9" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"],
        "7" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    ]
  ];
  expect(snares).toEqual(correctSnares);
});


test('instrumentation - cumulus - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/cumulus.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  // I'm not entirely convinced this is truly correct, I think it's more
  // likely these are intended as HT/kit snare parts - thus this becomes a regression test
  const correctSnares = [
    [
      "Snare", {
        "2" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"],
        "4" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    ]
  ];
  expect(snares).toEqual(correctSnares);
});

// bass section

test('instrumentation garlic - basses', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json")));
  const basses = figureClickyInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  const correctBasses = [
    [
      "Bass", {
        "0" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "18" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ],
    [
      "Bass 2", {
        "17" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"]
      }
    ]
  ];
  expect(basses).toEqual(correctBasses);
});

test('instrumentation kuva - basses', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/kivakovakivikuva.json")));
  const basses = figureClickyInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  const correctBasses = [
    [
      "Bass" , {
        "0" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "18" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ],
    [
      "Bass 2" , {
        "17" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "1" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ]
  ];
  expect(basses).toEqual(correctBasses);
});

test('instrumentation cumulus - basses', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/cumulus.json")));
  const basses = figureClickyInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  const correctBasses = [
    [
      "Bass", {
        "0" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "1" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ],
    [
      "Tom", {
        "5" : DEFAULT_INSTRUMENT_SYMBOLS["Tom"]
      }
    ]
  ];
  expect(basses).toEqual(correctBasses);
});

test('instrumentation that_guy - basses', () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/that_guy.json")));
  const basses = figureClickyInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  const correctBasses = [
    [
      "Bass" , {
        "0" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "1" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ],
    [
      "Bass 2" , {
        "6" : DEFAULT_INSTRUMENT_SYMBOLS["Bass"],
        "8" : DEFAULT_INSTRUMENT_SYMBOLS["Click"]
      }
    ]
  ];
  expect(basses).toEqual(correctBasses);
});


const thatGuyInstruments = [
  ["Bass", {"0" : "O", "1" : "X"}],
  ["Bass 2", {"6" : "O", "8" : "X"}],
  ["Djembe", {"2" : "S", "3" : "t", "4" : "O"}],
  ["Snare", {"7" : "X", "9" : "x"}],
  ["Shaker", {"5" : "X"}]
];

test("instrumentation that_guy", () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/that_guy.json")));
  const instruments = figureInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  expect(instruments).toEqual(thatGuyInstruments);
});

const cumulusInstruments = [
  ["Bass", {"0" : "O", "1" : "X"}],
  ["Tom", {"5" : "O"}],
  ["Snare", { "2" : "x",  "4" : "X"}], // FIXME: This is regressing a lack of functionality, should recognise multiple snare parts
  ["Hand Clap", {"3" : "X"}] // Note: this should really be a tom-click ... but how would we figure that? Maybe guessing at parts adjacent to clickydrums?
];

test("instrumentation cumulus", () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/cumulus.json")));
  const instruments = figureInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  expect(instruments).toEqual(cumulusInstruments);
});

const kuvaInstruments = [
  ["Bass", {"0" : "O", "18" : "X"}],
  ["Bass 2", {"1" : "X", "17" : "O"}],
  ["Djembe", {"10" : "S", "11" : "t", "12" : "O"}],
  ["Snare", {"2" : "X", "13" : "x"}],
  ["Shaker", {"16" : "x", "21" : "X"}]
];

test("instrumentation kuva", () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/kivakovakivikuva.json")));
  const instruments = figureInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  expect(instruments).toEqual(kuvaInstruments);
});

// coconotInstruments are a bit of a mess, some of the patterns are mid-bass
// and some are tom, and grouping sticks/drums gets abandoned
// and just inserted as separate tracks
// but this is an acceptable failure mode
const coconotInstruments = [
  [ 'Bass', { '0': 'O', '18': 'X' } ],
  [ 'Djembe', { '10': 'S', '11': 't', '12': 'O' } ],
  [ 'Snare', { '2': 'X', '13': 'x' } ],
  [ 'Shaker', { '16': 'x', '21': 'X' } ],
  [ 'Stick', { '1': 'X' } ],
  [ 'Stick', { '20': 'X' } ],
  [ 'Kick', { '17': 'O' } ],
  [ 'tom02', { '19': 'O' } ]
];

test("instrumentation coconot", () => {
  const state = createObjects(JSON.parse(fs.readFileSync("./test_data/coconot.json")));
  const instruments = figureInstruments( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS, state.patterns );
  expect(instruments).toEqual(coconotInstruments);
});
