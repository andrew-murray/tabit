import kuva from "./kuva.json";
import {
  activeInstrumentation,
  createInstrumentMask,
  DEFAULT_INSTRUMENT_SYMBOLS,
  figureInstruments,
  guessShortName
} from "./instrumentation";
import Track from "./Track";
import SparseTrack from "./SparseTrack";
import {DefaultSettings} from "./FormatSettings";
import notation from "./notation"
import Audio from "./Audio"
import AVAILABLE_SAMPLES from "./samples.json"

const TRACK_FORMAT_SPARSE = true;

const figurePatternSettings = (patterns, instruments)=>{
  return Array.from(
    patterns,
    (p) => notation.guessPerPatternSettings( p.instrumentTracks, instruments )
  );
};
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
    patterns,
    formatSettings,
    patternSettings,
    audioState
  )
  {
    this.title = title;
    this.sourceFile = sourceFile;
    this.instruments = instruments;
    this.instrumentIndex = instrumentIndex;
    this.instrumentMask = instrumentMask;
    this.patterns = patterns;
    this.formatSettings = formatSettings;
    this.patternSettings = patternSettings;
    this.audioState = audioState;
  }
};

function createPatternsFromData(patternData)
{
  // the instruments currently work as simple objects
  // we need to create tracks!
  let patterns = [];
  for( let pattern of patternData )
  {
    // we use this default, in one case see below
    const patternResolution = pattern.resolution;
    let replacedTracks = {};
    // todo: find a more compact way of doing this
    for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
    {
      if( "resolution" in trackData )
      {
        const loadedTrack = new Track( trackData.rep, trackData.resolution );
        replacedTracks[id] = TRACK_FORMAT_SPARSE ? new SparseTrack( loadedTrack.toPoints(), loadedTrack.length())
                                                 : loadedTrack;
      }
      else
      {
        replacedTracks[id] = TRACK_FORMAT_SPARSE ? new SparseTrack( trackData.points, trackData.length_ )
                                                 : Track.fromPositions( trackData.points, trackData.length_, patternResolution );
      }
    }
    let patternWithTracks = Object.assign({}, pattern);
    patternWithTracks.instrumentTracks = replacedTracks;
    patterns.push(patternWithTracks);
  }
  return patterns;
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function prepHydrogenVolumes(instrumentIndex)
{

  // I think hydrogen treats all its volumes/gains as linear,
  // let's use that assumption, map the max to 1.0 on our volume-curve and
  // normalize everything else relative to thatss

  // find the maxGain to normalize to
  let maxGain = 0.0;
  for( const instrument of instrumentIndex )
  {
    const perInstrumentGain = instrument.volume * instrument.gain;
    maxGain = Math.max( perInstrumentGain, maxGain );
  }

  const maxVolume = Audio.convertAudibleToNormal(maxGain);
  let outputIndex = [];
  for( let instrument of instrumentIndex )
  {
    const volumeModel = Audio.convertAudibleToNormal(instrument.volume * instrument.gain);
    // remove the gain, in the hope that we can handle it with just the volume model
    let outputInstrument = Object.assign(
      Object.assign( {}, instrument ),
      {volume: clamp(volumeModel / maxVolume, 0.0, 1.0)}
    );
    if(outputInstrument.hasOwnProperty("gain"))
    {
      delete outputInstrument["gain"];
    }
    outputIndex.push( outputInstrument );
  }
  return outputIndex;
}

function upgradeOldInstruments(instruments)
{
  // instruments is an array of [name, symbolmapping, possible metadata]
  return instruments.map(
    inst => {
      if(inst.length === 2)
      {
        return [inst[0], inst[1], { "shortName" : guessShortName(inst[0])}];
      }
      else
      {
        return inst;
      }
    }
  )
}

function upgradeOldInstrumentIndex(instrumentIndex)
{
  // we generally want all instrument filenames to refer to wav files in our system, if possible
  // this was not always needed/enforced, upgrade old things
  let instrumentIndexCopy = instrumentIndex.slice();
  for(let instIndex = 0; instIndex < instrumentIndexCopy.length; ++instIndex)
  {
    const inst = instrumentIndexCopy[instIndex];
    if( (inst.drumkit && inst.drumkit in AVAILABLE_SAMPLES)
      && (inst.filename))
    {
      // if we support the drumkit, let's silently swap out flac for wav, nice 'n' early
      instrumentIndexCopy[instIndex] = Object.assign(
        Object.assign( {}, inst ),
        {filename: inst.filename.toString().replace(".flac", ".wav")}
      );
    }
  }
  return instrumentIndexCopy;
}

function LoadJSON(jsonData, title, filename, fromHydrogen)
{
  return new Promise((resolve) =>
    {
      const patterns = createPatternsFromData(jsonData.patterns);
      const oldInstruments = !fromHydrogen? jsonData.instruments : figureInstruments(
        jsonData.instruments,
        DEFAULT_INSTRUMENT_SYMBOLS,
        patterns
      );
      const instruments = upgradeOldInstruments(oldInstruments);
      const instrumentIndex = upgradeOldInstrumentIndex(
        jsonData.instrumentIndex ? jsonData.instrumentIndex
                                 : prepHydrogenVolumes( activeInstrumentation(jsonData.instruments, patterns) )
      );
      const instrumentMask = createInstrumentMask(instrumentIndex, instruments);
      const formatSettings = Object.assign(
        Object.assign({}, DefaultSettings),
        jsonData.formatSettings ? jsonData.formatSettings : {}
      );
      const expectedPatternSettings = figurePatternSettings(patterns, instruments);
      let patternSettings = null;
      if(jsonData.patternSettings !== undefined)
      {
        // note, while object-assign is a little simplistic (what happens for nested-objects?)
        // if an individualResolutions (the only nested-object) is defined in the previous-state, we want to take it exactly
        // and not worry about any complicated state resolution
        patternSettings = Object.keys(expectedPatternSettings).map( i => Object.assign(expectedPatternSettings[i], jsonData.patternSettings[i]))
      }
      else
      {
        patternSettings = expectedPatternSettings;
      }
      const audioState = jsonData.audioState ? jsonData.audioState : { tempo : 100.0 };
      resolve( new SongData(
        title,
        filename,
        instruments,
        instrumentIndex,
        instrumentMask,
        patterns,
        formatSettings,
        patternSettings,
        audioState
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
    false // fromHydrogen
  );
}


const moduleExports = {
  LoadExample,
  LoadJSON,
  TRACK_FORMAT_SPARSE
};

export default moduleExports;
