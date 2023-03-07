import Audio from "./Audio"
import * as Tone from "tone";
import AVAILABLE_SAMPLES from "./samples.json";
import Track from "./Track";
// these are the hydrogen drumkits available by GPL/CC

const DRUMKITS = Object.keys( AVAILABLE_SAMPLES );

const chooseAppropriateInstrument = (drumkitName, instrumentName) =>
{
  const name = instrumentName.toLowerCase();
  // this is currently very basic
  if(name.includes("kick"))
  {
      return {drumkit: "The Black Pearl 1.0", filename: "PearlKick-Hard.wav"};
  }
  else if(name.includes("stick"))
  {
      return {drumkit: "DeathMetal", filename: "16297_ltibbits_sticks_low_pitch.wav"};
  }
  else if(name.includes("tom"))
  {
      return {drumkit: "Millo_MultiLayered3", filename: "ft_01.wav"};
  }
  else if(name.includes("clap"))
  {
      return {drumkit: "TR808EmulationKit", filename: "808_Clap.wav"};
  }
  else if(name.includes("snare"))
  {
    return {drumkit: "GMRockKit", filename: "Snare-Soft.wav"};
  }
  else if(name.includes("cowbell"))
  {
    return {drumkit: "GMRockKit", filename: "Cowbell-Softest.wav"};
  }
  else
  {
    // todo: cymbals
    return null;
  }
}

const createInstrumentsToLoad = (instrumentIndex, patterns) =>
{
    let instrumentsToLoad = new Map();
    for(const p of patterns)
    {
      for(const id of Object.keys(p.instrumentTracks))
      {
        if(!instrumentsToLoad.has(id))
        {
          const selected = instrumentIndex.filter(inst => inst.id.toString() === id);
          if(selected.length > 0)
          {
            instrumentsToLoad.set(id, selected[0]);
          }
        }
      }
    }
    return instrumentsToLoad;
}

const selectSamplesForInstruments = (instrumentsToLoad) =>
{
  console.log("=======================");
  console.log(" Selecting Instruments ");
  console.log("=======================");
  let samples = {};
  let failures = [];
  for(const [id, instrument] of instrumentsToLoad.entries())
  {
    const clampedVolume = Audio.convertNormalToAudible( Math.min( Math.max( 0.0 , instrument.volume ), 1.0 ) );
    let urlForSample = null;
    if(
      "drumkit" in instrument &&
      "filename" in instrument &&
      DRUMKITS.includes(instrument.drumkit) &&
      AVAILABLE_SAMPLES[instrument.drumkit].includes(instrument.filename) )
    {
      urlForSample = process.env.PUBLIC_URL + "/wav/" + instrument.drumkit + "/" + instrument.filename;
    }
    else if("drumkit" in selectedInstrument )
    {
      const instrumentObject = chooseAppropriateInstrument( instrument.drumkit, instrument.name );
      urlForSample = process.env.PUBLIC_URL + "/wav/" + instrumentObject.drumkit + "/" + instrumentObject.filename;
      console.log({
        inputInstrument: instrument,
        outputInstrument: instrumentObject
      });
    }
    else
    {
      failures.push( [instrument.drumkit, instrument.name] );
      continue;
    }
    samples[id] = {
      drumkit: instrument.drumkit,
      filename: instrument.filename,
      url: urlForSample
    };
  }
  return {
    samples,
    failures
  };
};

const create
