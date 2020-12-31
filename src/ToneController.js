
import Audio from "./Audio"
import * as Tone from "tone";

// we schedule for a delay of 120ms to allow the audio context to catch up
const AUDIO_DELAY = 0.12;

// these are the hydrogen drumkits available by GPL/CC

const DRUMKITS = [
  "circAfrique v4",
  "DeathMetal",
  "The Black Pearl 1.0",
  "GMRockKit",
  "TR808EmulationKit"
];

const convertNormalToAudible = (value) => {
  // add an intuitive feel to gain values, perception of sound is non-linear
  // https://www.dr-lex.be/info-stuff/volumecontrols.html
  // note: I tried x^4 and I tried using tone's DB directly but neither felt very good.
  return Math.pow(value, 2.5);
};

const chooseAppropriateUrlForInstrument = (drumkitName, instrumentName) =>
{
  const name = instrumentName.toLowerCase();
  // this is currently very basic
  if(name.includes("kick"))
  {
      return "The Black Pearl 1.0/PearlKick-Hard.wav";
  }
  else if(name.includes("stick"))
  {
      return "DeathMetal/16297_ltibbits_sticks_low_pitch.wav";
  }
  else if(name.includes("tom"))
  {
      return "TR808EmulationKit/808_Tom_Mid.wav"
  }
  else if(name.includes("clap"))
  {
      return "TR808EmulationKit/808_Clap.wav";
  }
  else if(name.includes("snare"))
  {
    return "GMRockKit/Snare-Soft.wav";
  }
  else if(name.includes("cowbell"))
  {
    return "GMRockKit/Cowbell-Softest.wav";
  }
  else
  {
    // todo: snare, cymbals
    return null;
  }
}

const createSequenceCallback = (pattern, sampleSource) =>
{
  let samplesReady = sampleSource.samplesReady();
  const sequenceCallback = (time, indexFromStart) =>
  {
    // if we don't know samples are ready,
    if(!samplesReady)
    {
      // update our knowledge, and early out if needed
      samplesReady = sampleSource.samplesReady();
      if(!samplesReady){ return; }
    }
    const trackLengthRes = ( pattern.length / pattern.resolution );
    const index = indexFromStart % trackLengthRes;
    for(const [id,t] of Object.entries(pattern.tracks))
    {
        if( t.rep[index] )
        {
          const sampleData = sampleSource.samples[id];
          if( sampleData !== undefined )
          {
            sampleData.player.start(time + AUDIO_DELAY);
          }
        }
    }
    if(sampleSource.onPatternTimeChange)
    {
      Tone.Draw.schedule(
        ()=>{
          if(Tone.getTransport().state === "started")
          {
            const notePosition = (index * pattern.resolution) % pattern.length;
            sampleSource.onPatternTimeChange(notePosition);
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
    latencyHint
  )
  {

    if(latencyHint && Tone.context.latencyHint !== latencyHint)
    {
      let context = new Tone.Context({latencyHint: latencyHint});
      Tone.setContext(context);
    }

    // this thing has a lot of state, eh?
    // would love if this state was a bit more structured
    this.samples = {};
    this.currentPattern = null;
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

    if(failures.length > 0)
    {
      let message = "Failed to load samples for instruments:\n";
      let sortedFailures = createSortedUnique(failures);
      for( const [drumkit, name] of sortedFailures )
      {
        message += "    -" + name;
        if( drumkit !== "" ){ message += " (" + drumkit + ")"; }
        message += "\n";
      }
      message += "This is typically because they belong to commercial sound libraries. " +
       "tabit's supported drumkits are\n" + DRUMKITS.join( ", " ) + ".";

      alert(message);
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

  populateSamples(instrumentIndex, tracks, failures)
  {
    this.sampleCount = 0;
    for(const [id,] of Object.entries(tracks))
    {
      const selected = instrumentIndex.filter(inst => inst.id.toString() === id);
      if( selected.length > 0)
      {
        const selectedInstrument = selected[0];
        const clampedVolume = convertNormalToAudible( Math.min( Math.max( 0.0 , selectedInstrument.volume ), 1.0 ) );
        if( selectedInstrument.id in this.samples )
        {
          continue;
        }
        if(
          "drumkit" in selectedInstrument &&
          "filename" in selectedInstrument &&
          DRUMKITS.includes(selectedInstrument.drumkit) )
        {
          const filename = selectedInstrument.filename.replace(".flac", ".wav");
          let player = new Tone.Player(
            process.env.PUBLIC_URL + "/wav/" + selectedInstrument.drumkit + "/" + filename,
            () => { this.sampleCount++; }
          );
          player.mute = selectedInstrument.muted;
          player.name = selectedInstrument.name;
          const gain = new Tone.Gain(clampedVolume, "normalRange");
          player.connect(gain)
          gain.connect(this.gain);
          this.samples[selectedInstrument.id] = { player : player, gain : gain }
          this.expectedSampleCount++;
        }
        else if( "drumkit" in selectedInstrument )
        {
          const relativeUrl = chooseAppropriateUrlForInstrument( selectedInstrument.drumkit, selectedInstrument.name );
          if(relativeUrl !== null)
          {
            let player = new Tone.Player(
              process.env.PUBLIC_URL + "/wav/" + relativeUrl,
              () => { this.sampleCount++; }
            );
            player.mute = selectedInstrument.muted;
            player.name = selectedInstrument.name;
            const gain = new Tone.Gain(clampedVolume, "normalRange");
            player.connect(gain);
            gain.connect(this.gain);
            this.samples[selectedInstrument.id] = { player : player, gain : gain }
            this.expectedSampleCount++;
          }
          else
          {
            failures.push( [selectedInstrument.drumkit, selectedInstrument.name] );
          }
        }
        else
        {
            failures.push( ["", selectedInstrument.name] );
        }
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
    const oldPatternName = this.currentPatternName !== null ? this.currentPatternName : null;
    const length = this.patternDetails[patternName].length;
    const oldLength = oldPatternName !== null ? this.patternDetails[oldPatternName] : null

    // we have a little fudge in here... if we're transitioning from a 4 beat loop
    // to an 8 beat pattern ... we probably really wanted to hit the start of that pattern,
    // not to transition at 3.75 beats and play the latter half
    const timeFromBarEnd = Tone.getTransport().loopEnd - ( Tone.getTransport().toSeconds(Tone.getTransport().position) + AUDIO_DELAY );
    const queueTransition = oldPatternName !== null
    && Tone.getTransport().state === "started"
    && ( timeFromBarEnd > 0 && timeFromBarEnd < Tone.getTransport().toSeconds(Tone.Time("8n")));

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
      this.sequence = this.createSequenceForPattern(this.instrumentIndex, this.patternDetails[patternName].pattern)
      this.sequence._part.mute = false;
      this.currentPatternName = patternName;
    };

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
        Tone.Draw.schedule(
          ()=>{
            this.onPatternTimeChange( null );
          },
          Tone.getTransport().now()
        );
      }
    }
  }

  setMutedForInstrument(instrumentID, muted)
  {
    this.samples[instrumentID].player.mute = muted;
  }

  setVolumeForInstrument(instrumentID, volume)
  {
    this.samples[instrumentID].gain.set( {gain : convertNormalToAudible(volume) } );
  }

  setTempo(tempo)
  {
    Tone.getTransport().bpm.value = tempo;
  }
};



export default ToneController;