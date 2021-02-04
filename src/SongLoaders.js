import kuva from "./kuva.json";
import {
  activeInstrumentation,
  createInstrumentMask,
  DEFAULT_INSTRUMENT_SYMBOLS,
  figureInstruments
} from "./instrumentation";
import track from "./track";

// note that a Pattern contains
// {
//    size, name, notes
//    resolution, instrumentTracks (instrumentTracks are a class)
// }

class SongData {
  constructor(
    title,
    sourceFile,
    instruments,
    instrumentIndex,
    instrumentMask,
    patterns
  )
  {
    this.title = title;
    this.sourceFile = sourceFile;
    this.instruments = instruments;
    this.instrumentIndex = instrumentIndex;
    this.instrumentMask = instrumentMask;
    this.patterns = patterns;
  }
};

function createPatternsFromData(patternData)
{
  // the instruments currently work as simple objects
  // we need to create tracks!
  let patterns = [];
  for( let pattern of patternData )
  {
    let replacedTracks = {};
    // todo: find a more compact way of doing this
    for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
    {
      replacedTracks[id] = new track( trackData.rep, trackData.resolution );
    }
    let patternWithTracks = Object.assign({}, pattern);
    patternWithTracks.instrumentTracks = replacedTracks;
    patterns.push(patternWithTracks);
  }
  return patterns;
}

function prepHydrogenVolumes(instrumentIndex)
{
  // fixme: convert hydrogen volume/gain to normal values, somewhere
  for( let instrument of instrumentIndex )
  {
    instrument.volume = 0.5;
  }
  return instrumentIndex;
}

function LoadJSON(jsonData, title, filename, fromHydrogen)
{
  return new Promise((resolve) =>
    {
      const patterns = createPatternsFromData(jsonData.patterns);
      const instruments = !fromHydrogen? jsonData.instruments : figureInstruments(
        jsonData.instruments,
        DEFAULT_INSTRUMENT_SYMBOLS,
        patterns
      );
      const instrumentIndex = jsonData.instrumentIndex ? jsonData.instrumentIndex
        : prepHydrogenVolumes( activeInstrumentation(jsonData.instruments, patterns) );
      const instrumentMask = createInstrumentMask(instrumentIndex, instruments);
      resolve( new SongData(
        title,
        filename,
        instruments,
        instrumentIndex,
        instrumentMask,
        patterns
      ) );
    }
  );

}

function LoadExample()
{
  return LoadJSON(
    kuva,
    "kuva",
    "kuva.example",
    true // fromHydrogen
  );
}


const moduleExports = {
  LoadExample,
  LoadJSON
};

export default moduleExports;