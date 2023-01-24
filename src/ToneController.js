import Audio from "./Audio"
import * as Tone from "tone";
import AVAILABLE_SAMPLES from "./samples.json";
import Track from "./Track";

// we schedule for a delay of 50ms to allow the audio context to catch up
const DEFAULT_AUDIO_DELAY = 0.05;
let AUDIO_DELAY = DEFAULT_AUDIO_DELAY;

const setAudioDelay = (value) => {
  AUDIO_DELAY = value;
};
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

const createSequenceCallback = (pattern, sampleSource) =>
{
  let samplesReady = sampleSource.samplesReady();
  let denseTracks = {};
  let velocityTracks = {};
  for(const [id,t] of Object.entries(pattern.tracks))
  {
    if(t.isDense()){ denseTracks[id] = t;}
    else
    {
      denseTracks[id] = Track.fromPositions(t.toPoints(), t.length(), pattern.resolution );
      velocityTracks[id] = Track.fromPositionsAndValues(t.toPoints(), t.getVelocities(), t.length(), pattern.resolution);
    }
  }
  const sequenceCallback = (time, indexFromStart) =>
  {
    // if we don't know samples are ready,
    if(!samplesReady)
    {
      // update our knowledge, and early out if needed
      samplesReady = sampleSource.samplesReady();
      if(!samplesReady){ return; }
    }
    if(window.trace)
    {
      window.trace("playing sequence callback at time " + String(time) + " index " + String(indexFromStart) );
    }
    for(const [id,t] of Object.entries(denseTracks))
    {
        if( t.rep[indexFromStart] )
        {
          const sampleData = sampleSource.samples[id];
          if( sampleData !== undefined )
          {
            // we ensure the sample stops '10ms' before the beat as presumably
            // that'll make tonejs happier (hopefully this should be small enough, never to clash with earlier notes?)
            sampleData.player.stop(time + AUDIO_DELAY - 0.01);
            // what can we do with velocityTracks[id]
            // if we modify a gain node ... it'll be out of sync
            sampleData.player.start(time + AUDIO_DELAY);
          }
        }
    }
    if(sampleSource.onPatternTimeChange)
    {
      Tone.getDraw().schedule(
        ()=>{
          if(Tone.getTransport().state === "started")
          {
            const notePosition = (indexFromStart * pattern.resolution) % pattern.length;
            if(sampleSource.onPatternTimeChange)
            {
              sampleSource.onPatternTimeChange(notePosition);
            }
          }
        },
        time + AUDIO_DELAY
      );
    }
  };
  return sequenceCallback;
};

const createSortedUnique = (failures) =>
{
  let sortedFailures = [];
  for( const [drumkit, name] of failures )
  {
    let noMatch = true;
    for( const [otherDrumkit, otherName] of sortedFailures )
    {
      if( drumkit === otherDrumkit && name === otherName )
      {
        noMatch = false;
        break;
      }
    }
    if( noMatch )
    {
      sortedFailures.push( [drumkit, name] );
    }
  }
  sortedFailures.sort();
  return sortedFailures;
}

class ToneController
{
  constructor(
    instrumentIndex,
    patterns,
    tempo,
    onTimeChange,
    latencyHint,
    onLoadError
  )
  {

    if(onLoadError)
    {
      const patternNames = patterns.map(p=>p.name);
      const patternNameSet = new Set(patternNames);
      if(patternNames.length !== patternNameSet.size)
      {
          onLoadError("Warning: tabit currently only supports inputs where all the pattern names are unique. Good luck!");
      }
    }

    if(latencyHint && Tone.context.latencyHint !== latencyHint)
    {
      let context = new Tone.Context({latencyHint: latencyHint});
      Tone.setContext(context);
    }

    // also configure a larger audio delay, if we're being requested to
    // prioritise playback over latency
    if(latencyHint === "playback")
    {
      // value in seconds (relatively arbitrary)
      setAudioDelay(0.2)
    }
    else
    {
      setAudioDelay(DEFAULT_AUDIO_DELAY);
    }

    this.latencyHint = latencyHint;

    // this thing has a lot of state, eh?
    // would love if this state was a bit more structured
    this.samples = {};
    this.currentPattern = null;
    // we're mostly trying to match hydrogen for this
    // and since I've rigged import to set volumes to max-1 (rather than knowing about any gain on top)
    // of where volume would sit, here we add a constant-offset to try and bump the volume, where we're
    // setting volumes < 1s, is this an acceptable fudge for a somewhat problematic architecture?
    this.gain = new Tone.Gain();
    this.gain.toDestination();
    this.onPatternTimeChange = onTimeChange;
    Tone.getTransport().bpm.value = tempo;
    Tone.getTransport().loop = true;

    this.sampleCount = 0;
    this.expectedSampleCount = 0;
    this.patternDetails = {};
    let failures = []
    for( let p of patterns )
    {
      this.patternDetails[p.name] = {
        resolution: Audio.determineMinResolution(instrumentIndex, p.instrumentTracks ),
        length : Audio.determineTrackLength(instrumentIndex, p.instrumentTracks ),
        name: p.name,
        tracks: p.instrumentTracks,
        pattern: p
      };
      this.populateSamples(instrumentIndex, p.instrumentTracks, failures);
    }
    this.currentPatternName = null;
    this.instrumentIndex = instrumentIndex;

    if(failures.length > 0 && onLoadError)
    {
      const sortedFailures = createSortedUnique(failures);
      const plural = sortedFailures.length > 1 ;
      const s = plural ? "s" : "";
      let message = "Failed to load sample" + s + " for instrument" + s + ": " + (plural ? "{" : "");
      for( let failureIndex = 0; failureIndex < sortedFailures.length; ++failureIndex )
      {
        const [drumkit, name] = sortedFailures[failureIndex];
        message += name;
        if( drumkit !== "" ){ message += " (" + drumkit + ")"; }
        if(failureIndex !== sortedFailures.length - 1){ message += ", "; }
        else{ message += (plural ? "}" : "") + "." }
      }
      message += "\n" +
       "tabit's supported drumkits are " + DRUMKITS.join( ", " ) + ".";

      onLoadError(message);
    }
  }

  teardown()
  {
    this.stop();
    // cancel all future events
    // note: it's unclear if this will appropriately dispose of all sequences & samples
    // so this may be a performance problem in the long term
    Tone.getTransport().cancel();
  }

  samplesReady()
  {
    return this.sampleCount === this.expectedSampleCount;
  }

  updatePattern = (p) =>
  {
    this.patternDetails[p.name] = {
      resolution: Audio.determineMinResolution(this.instrumentIndex, p.instrumentTracks ),
      length : Audio.determineTrackLength(this.instrumentIndex, p.instrumentTracks ),
      name: p.name,
      tracks: p.instrumentTracks,
      pattern: p
    };

    if( p.name === this.currentPatternName)
    {
      const updatedSequence = this.createSequenceForPattern(this.instrumentIndex, this.patternDetails[p.name].pattern);
      this.sequence._part.mute = true;
      this.sequence = updatedSequence;
      updatedSequence._part.mute = false;
    }
  }

  removePattern = (patternName) =>
  {
    if(patternName === this.currentPatternName)
    {
      // todo: we could support this, but it should be unnecessary
      // the above class should always change away first
      throw new Error("Can't delete the current pattern!");
    }
    this.patternDetails[patternName] = undefined;
  }

  populateSamples(instrumentIndex, tracks, failures)
  {
    console.log("=======================");
    console.log(" Selecting Instruments ");
    console.log("=======================");
    for(const [id,] of Object.entries(tracks))
    {
      const selected = instrumentIndex.filter(inst => inst.id.toString() === id);
      if(selected.length > 0)
      {
        const selectedInstrument = selected[0];
        const clampedVolume = Audio.convertNormalToAudible( Math.min( Math.max( 0.0 , selectedInstrument.volume ), 1.0 ) );

        let urlForSample = null;
        if(
          "drumkit" in selectedInstrument &&
          "filename" in selectedInstrument &&
          DRUMKITS.includes(selectedInstrument.drumkit) &&
          AVAILABLE_SAMPLES[selectedInstrument.drumkit].includes(selectedInstrument.filename) )
        {
          urlForSample = process.env.PUBLIC_URL + "/wav/" + selectedInstrument.drumkit + "/" + selectedInstrument.filename;
        }
        else if("drumkit" in selectedInstrument )
        {
          const instrumentObject = chooseAppropriateInstrument( selectedInstrument.drumkit, selectedInstrument.name );
          urlForSample = process.env.PUBLIC_URL + "/wav/" + instrumentObject.drumkit + "/" + instrumentObject.filename;
          console.log({
            inputInstrument: selectedInstrument,
            outputInstrument: instrumentObject
          });
        }
        else
        {
          failures.push( [selectedInstrument.drumkit, selectedInstrument.name] );
          continue;
        }

        if( selectedInstrument.id in this.samples && this.samples[selectedInstrument.id].url === urlForSample )
        {
          // no need to reload
          continue;
        }

        if(selectedInstrument.id in this.samples)
        {
          this.samples[selectedInstrument.id].gain.disconnect();
          this.samples[selectedInstrument.id].player.disconnect();
          this.samples[selectedInstrument.id].gain.dispose();
          this.samples[selectedInstrument.id].player.dispose();
        }
        let player = new Tone.Player(
          urlForSample,
          () => { this.sampleCount++; }
        );
        player.mute = selectedInstrument.muted;
        player.name = selectedInstrument.name;
        const gain = new Tone.Gain(clampedVolume, "normalRange");
        // const velocityGain = new Tone.Gain(1.0, "normalRange");
        player.connect(gain)
        gain.connect(this.gain);
        this.samples[selectedInstrument.id] = {
          player : player,
          gain : gain,
          // velocityGain: velocityGain,
          drumkit: selectedInstrument.drumkit,
          filename: selectedInstrument.filename,
          url: urlForSample
        };
        this.expectedSampleCount++;
      }
    }
  }

  createSequenceForPattern(instrumentIndex, pattern)
  {
    const patternResolution = this.patternDetails[pattern.name].resolution;
    const patternLength = this.patternDetails[pattern.name].length;
    const callback = createSequenceCallback(
      this.patternDetails[pattern.name],
      this
    );
    let seq = new Tone.Sequence(
      callback,
      [...Array(patternLength / patternResolution).keys()],
      Tone.Time("4n") * ( patternResolution / 48.0 )
    );
    // start the sequence, but the ticks won't be triggered when muted
    // note: setting mute on the sequence directly seems to have no effect
    seq._part.mute = true;
    seq.start(0);
    return seq;
  }

  createSequences(instrumentIndex, patterns)
  {
    let sequences = {};
    for( let p of patterns )
    {
      sequences[p.name] = this.createSequenceForPattern(instrumentIndex, p);
    }
    return sequences;
  }

  setActivePattern( patternName )
  {
    if(patternName === this.currentPatternName)
    {
      return;
    }
    const oldPatternName = this.currentPatternName !== null ? this.currentPatternName : null;
    const length = this.patternDetails[patternName].length;
    const oldLength = oldPatternName !== null ? this.patternDetails[oldPatternName] : null

    // TODO: Since introducing a scheduling delay, this fudge factor is less reliable
    // Particularly, the transition gets queued but the first beat is a little sloppy
    // it's possible the whole transition functor needs to be faster

    // we have a little fudge in here... if we're transitioning from a 4 beat loop
    // to an 8 beat pattern ... we probably really wanted to hit the start of that pattern,
    // not to transition at 3.75 beats and play the latter half
    const timeFromBarEnd = Tone.getTransport().loopEnd - ( Tone.getTransport().toSeconds(Tone.getTransport().position) - AUDIO_DELAY );

    // if we've been told playback speed should be prioritised, let's just pause as we change
    const stopToChange = this.latencyHint === "playback";
    const queueTransition = !stopToChange
      && oldPatternName !== null
      && Tone.getTransport().state === "started"
      && ( timeFromBarEnd > 0 && timeFromBarEnd < Tone.getTransport().toSeconds(Tone.Time("8n")));

    // create this before starting the "transaction"
    const nextSequence = this.createSequenceForPattern(this.instrumentIndex, this.patternDetails[patternName].pattern);

    const enableNewTrack = (time) => {
      if(oldPatternName !== null)
      {
        // note: setting mute on the sequence directly seems to have no effect
        this.sequence._part.mute = true;
      }
      if(oldPatternName === null || oldLength !== length )
      {

        Tone.getTransport().setLoopPoints(0, Tone.Time("4n") * (length / 48.0));
      }
      this.sequence = nextSequence;
      this.sequence._part.mute = false;
      this.currentPatternName = patternName;
    };

    const playing = Tone.getTransport().state === "started";
    if(stopToChange && playing)
    {
      this.stop();
    }

    if( queueTransition ) {
      Tone.getTransport().scheduleOnce(
        enableNewTrack,
        Tone.Time("0")
      );
    }
    else
    {
      enableNewTrack();
    }
    if(stopToChange && playing)
    {
      this.play();
    }
  }

  isPlaying()
  {
      const playing = Tone.getTransport().state === "started";
      return playing;
  }

  play()
  {
    // Tone.start is needed to be triggered from a user interaction
    // (web-audio-context policy of not playing until a user interaction)
    Tone.start().then(()=>{Tone.getTransport().start();});
  }

  stop()
  {
    // it's slightly unclear what the synchronisation semantics of this Tone.getTransport().stop() call are.
    // If a tick is currently in flight on Tone.getTransport() we have to ensure that
    // the reset of patternTime occurs *afterwards*.
    // The below calls seem to work for this, but I couldn't tell you why.
    if( Tone.getTransport().state === "started")
    {
      Tone.getTransport().stop();
      if( this.onPatternTimeChange )
      {
        Tone.getDraw().schedule(
          ()=>{
            this.onPatternTimeChange( null );
          },
          Tone.getTransport().now()
        );
      }
    }
  }

  setAnimateCallback(onPatternTimeChange)
  {
    if(this.onPatternTimeChange)
    {
      this.onPatternTimeChange(null);
    }
    this.onPatternTimeChange = onPatternTimeChange;
  }

  setMutedForInstrument(instrumentID, muted)
  {
    this.samples[instrumentID].player.mute = muted;
  }

  setGainForInstrument(instrumentID, gainValue)
  {
    this.samples[instrumentID].gain.set( {gain : gainValue } );
  }

  setVolumeForInstrument(instrumentID, volume)
  {
    this.setGainForInstrument(instrumentID, Audio.convertNormalToAudible(volume));
  }

  setTempo(tempo)
  {
    Tone.getTransport().bpm.value = tempo;
  }

  getTempo()
  {
    return Tone.getTransport().bpm.value;
  }

  getExportState = () =>
  {
    return {
      tempo: Tone.getTransport().bpm.value
    };
  }
};



export default ToneController;
