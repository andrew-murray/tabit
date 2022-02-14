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

/**
 * It's hard to match what I hear in hydrogen, as I'd expect.
 * Let's try a custom curve PulseAudio claims to use a cubic model, from a skim of their code.
 */
function pulseAudioConvertNormalToAudible(value){
  return Math.pow(value, 3.0);
}

function pulseAudioConvertAudibleToNormal(value){
  // we provide the inverse of the above, rarely useful
  return Math.pow(value, 1.0/3.0);
}

function prepHydrogenVolumes(instrumentIndex)
{
  // hydrogen has a [0,1.5] volume
  // and a [0,5] gain, with 1 being the default in both cases

  // find the maxVolume to normalize to, based on a very naive model of volume/gain
  let maxVolume = 0.0;
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  for( let instrument of instrumentIndex )
  {
    const volumeModel = (instrument.volume / 1.5) * pulseAudioConvertAudibleToNormal(instrument.gain);
    maxVolume = Math.max( volumeModel, maxVolume );
  }

  for( let instrument of instrumentIndex )
  {
    // hydrogen's volume sliders seem to be a slider between [0,1.5]
    // (let's land it on our volume-curve and hope for the best)
    const volumeModel = (instrument.volume / 1.5) * pulseAudioConvertAudibleToNormal(instrument.gain);
    instrument.volume = clamp(volumeModel / maxVolume, 0.0, 1.0);
    // remove tshe gain, in the hope that we can handle it with just one model
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
      const instrumentIndex = jsonData.instrumentIndex ? jsonData.instrumentIndex
        : prepHydrogenVolumes( activeInstrumentation(jsonData.instruments, patterns) );
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
