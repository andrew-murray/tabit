// instrumentIntegration.test.js

import fs from "fs"

import notation from "../notation"
import { DEFAULT_INSTRUMENT_SYMBOLS, figureDjembes, figureShakers, figureSnares } from "../instrumentation"


test('instrumentation garlic - djembes', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const djembes = figureDjembes( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctDjembes = [
    { 
      "Djembe" : {
        "10" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Slap"], 
        "11" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Tone"],
        "12" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Bass"]
      }
    }
  ];
  expect(djembes).toEqual(correctDjembes);
});

test('instrumentation garlic - shakers', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const shakers = figureShakers( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctShakers = [
    { 
      "Shaker" : {
        "16" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Ghost"], 
        "21" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Accent"]
      }
    }
  ];
  expect(shakers).toEqual(correctShakers);
});

test('instrumentation garlic - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctSnares = [
    { 
      "Snare" : {
        "13" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"], 
        "2" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    }
  ];
  expect(snares).toEqual(correctSnares);
});

test('instrumentation - that_guy - djembes', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/too_much_garlic.json"));
  const djembes = figureDjembes( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctDjembes = [
    { 
      "Djembe" : {
        "10" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Slap"], 
        "11" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Tone"],
        "12" : DEFAULT_INSTRUMENT_SYMBOLS["Djembe Bass"]
      }
    }
  ];
  expect(djembes).toEqual(correctDjembes);
});

test('instrumentation - that_guy - shakers', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/that_guy.json"));
  const shakers = figureShakers( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctShakers = [
    { 
      "Shaker" : {
        "5" : DEFAULT_INSTRUMENT_SYMBOLS["Shaker Accent"]
      }
    }
  ];
  expect(shakers).toEqual(correctShakers);
});

test('instrumentation - that_guy - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/that_guy.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  const correctSnares = [
    { 
      "Snare" : {
        "9" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"], 
        "7" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    }
  ];
  expect(snares).toEqual(correctSnares);
});


test('instrumentation - cumulus - snares', () => {
  const state = JSON.parse(fs.readFileSync("./test_data/cumulus.json"));
  const snares = figureSnares( state.instruments, DEFAULT_INSTRUMENT_SYMBOLS );
  // I'm not entirely convinced this is truly correct, I think it's more
  // likely these are intended as HT/kit snare parts - thus this becomes a regression test
  const correctSnares = [
    { 
      "Snare" : {
        "2" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Ghost"], 
        "4" : DEFAULT_INSTRUMENT_SYMBOLS["Snare Accent"]
      }
    }
  ];
  expect(snares).toEqual(correctSnares);
});


