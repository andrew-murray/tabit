import kuva from "./kuva.json";
import {
  activeInstrumentation,
  createInstrumentMask,
  DEFAULT_INSTRUMENT_SYMBOLS,
  figureInstruments,
  guessShortName
} from "./instrumentation";
import track from "./track";
import {DefaultSettings} from "./formatSettings";
import notation from "./notation"
import Audio from "./Audio"
import AVAILABLE_SAMPLES from "./samples.json"

const figurePatternSettings = (patterns)=>{
  return Array.from(
    patterns,
    (p) => notation.guessPerPatternSettings( p.instrumentTracks )
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

  for( let instrument of instrumentIndex )
  {
    const volumeModel = Audio.convertAudibleToNormal(instrument.volume * instrument.gain);
    instrument.volume = clamp(volumeModel / maxVolume, 0.0, 1.0);
    // remove the gain, in the hope that we can handle it with just the volume model
    instrument.gain = undefined;
  }
  return instrumentIndex;
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
        inst,
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
      const formatSettings = jsonData.formatSettings ? jsonData.formatSettings : Object.assign({}, DefaultSettings);
      const patternSettings = jsonData.patternSettings ? jsonData.patternSettings : figurePatternSettings(patterns);
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
    true // fromHydrogen
  );
}


const moduleExports = {
  LoadExample,
  LoadJSON
};

export default moduleExports;
