import React from 'react';
import Audio from "./Audio"

import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';
import * as Tone from "tone";

// these are the hydrogen drumkits available by GPL/CC

const DRUMKITS = [
  "circAfrique v4",
  "DeathMetal",
  "The Black Pearl 1.0",
  "GMRockKit",
  "TR808EmulationKit"
];

// TODO: This is very much not a react component, as it stands
//   

class ToneBoard extends React.Component
{

  constructor(props) {
    super(props);
    this.state = {
      tempo: 100.0
    };
    this.samplerCount = 0;
    this.sequences = {};
    this.gain = new Tone.Gain();
    this.gain.toDestination();
    Tone.Transport.bpm.value = this.state.tempo;
  }


  chooseAppropriateUrlForInstrument(drumkitName, instrumentName)
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
    else
    {
      // todo: snare, cymbals
      return null;
    }
  }


  populateSamples()
  {
    this.samplerCount = 0;
    this.expectedSamplerCount = 0;
    let mapping = {};
    const tracks = this.props.selectedPattern.instrumentTracks;
    for(const [id,] of Object.entries(tracks))
    {
      const selected = this.props.instrumentIndex.filter(inst => inst.id.toString() === id);
      if( selected.length > 0)
      {
        const selectedInstrument = selected[0];
        if(
          "drumkit" in selectedInstrument && 
          "filename" in selectedInstrument &&
          DRUMKITS.includes(selectedInstrument.drumkit) )
        {
          const filename = selectedInstrument.filename.replace(".flac", ".wav");
          mapping[selectedInstrument.id] = new Tone.Player( 
            process.env.PUBLIC_URL + "/wav/" + selectedInstrument.drumkit + "/" + filename, 
            () => { this.samplerCount++; } 
          );
          mapping[selectedInstrument.id].mute = selectedInstrument.muted;
          mapping[selectedInstrument.id].connect(this.gain);
          this.expectedSamplerCount++;
        }
        else if( "drumkit" in selectedInstrument )
        {
          const relativeUrl = this.chooseAppropriateUrlForInstrument( selectedInstrument.drumkit, selectedInstrument.name );
          if(relativeUrl !== null)
          {
            mapping[selectedInstrument.id] = new Tone.Player( 
              process.env.PUBLIC_URL + "/wav/" + relativeUrl, 
              () => { this.samplerCount++; } 
            );
            mapping[selectedInstrument.id].connect(this.gain);
            mapping[selectedInstrument.id].mute = selectedInstrument.muted;
            this.expectedSamplerCount++;
          }
        }
      }
    }
    this.samples = mapping;
  }

  createSequences()
  {
    const instrumentIndex = this.props.instrumentIndex;
    let sequences = {};
    for( let p of this.props.patterns )
    {
      const patternResolution = Audio.determineMinResolution(instrumentIndex, p.instrumentTracks);
      const patternLength = Audio.determineTrackLength(instrumentIndex, p.instrumentTracks);
      sequences[ p.name ] = new Tone.Sequence(
        (time,index) => { this.tick(time, index); },
        [...Array(patternLength / patternResolution).keys()],
        Tone.Time("4n") * ( patternResolution / 48.0 )
      );
      // start the sequence, but the ticks won't be triggered when muted
      // note: setting mute on the sequence directly seems to have no effect
      sequences[ p.name ]._part.mute = true;
      sequences[ p.name ].start(0);
    }
    return sequences;
  }

  schedulePlaybackForNewTracks()
  {
    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.selectedPattern.instrumentTracks;
    let board = this;
    // todo: precompute these numbers for smoother transitions?
    const resolution = Audio.determineMinResolution(instrumentIndex, tracks );
    const length = Audio.determineTrackLength(instrumentIndex, tracks );

    // we have a little fudge in here... if we're transitioning from a 4 beat loop
    // to an 8 beat pattern ... we probably really wanted to hit the start of that pattern,
    // not to transition at 3.75 beats and play the latter half
    const now = Tone.Transport.toSeconds(Tone.Transport.position);
    const timeFromBarEnd = Tone.Transport.loopEnd  - now;
    const queueTransition = Tone.Transport.state === "started" 
    && ( timeFromBarEnd > 0 && timeFromBarEnd < Tone.Time("8n").toSeconds())
    && ( length > this.state.length);
    const enableNewTrack = () => {
      // note: setting mute on the sequence directly seems to have no effect
      this.sequences[this.props.selectedPattern.name]._part.mute = false;
      Tone.Transport.loop = true;
      Tone.Transport.setLoopPoints(0, Tone.Time("4n") * (length / 48.0));
    };
    // react won't set state if these variables are equal
    // this mostly illustrates this component probably shouldn't have two state philosophies
    // note: we only trigger "queueTransition" when length > this.state.length so don't worry about that
    if( resolution === this.state.resolution && length === this.state.length )
    {
      enableNewTrack();
      return;
    }
    board.setState( 
      { 
        resolution : resolution,
        length : length
      },
      () => { 
        if( queueTransition ) { 
          Tone.Transport.scheduleOnce(
            enableNewTrack,
            Tone.Time("0")
          );
        }
        else
        {
          enableNewTrack();
        }
      }
    );
  }

  samplesReady()
  {
    return this.sampleCount === this.expectedSampleCount;
  }

  tick(time,indexFromStart)
  {
    if( time === this.lastTickTime )
    {
      // this sometimes seems to happen
      // and the samples complain
      // "start time must be strictly greater than previous start time"
      // this is a horrible temporary fix
      return;
    }
    this.lastTickTime = time;
    const trackLengthRes = ( this.state.length / this.state.resolution );
    const index = indexFromStart % trackLengthRes;
    if(!this.samplesReady())
    {
      return;
    }
    const tracks = this.props.selectedPattern.instrumentTracks;
    for(const [id,t] of Object.entries(tracks))
    {
        if( t.rep[index] )
        {
          this.samples[id].start(time);
        }
    }
    if( this.props.onPatternTimeChange )
    {
      Tone.Draw.schedule(
        ()=>{
          const notePosition = ( indexFromStart * this.state.resolution ) % this.state.length;
          this.props.onPatternTimeChange( notePosition );
        },
        time
      );
    }
  }

  play()
  {
    // Tone.start is needed to be triggered from a user interaction
    // (web-audio-context policy of not playing until a user interaction)
    Tone.start().then(()=>{Tone.Transport.start();});
  }

  stop()
  {
    // it's slightly unclear what the synchronisation semantics of this Tone.Transport.stop() call are.
    // If a tick is currently in flight on Tone.Transport we have to ensure that
    // the reset of patternTime occurs *afterwards*. 
    // The below calls seem to work for this, but I couldn't tell you why.
    if( Tone.Transport.state === "started")
    {
      Tone.Transport.stop();
      if( this.props.onPatternTimeChange )
      {
        Tone.Draw.schedule(
          ()=>{
            this.props.onPatternTimeChange( null );
          },
          Tone.Transport.now()
        );
      }
    }
  }

  componentDidMount()
  {
    this.populateSamples();
    this.sequences = this.createSequences();
    this.schedulePlaybackForNewTracks();
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    // theoretically we should be evaluating a rougher equality on the tracks here
    // but ... as is !== will never be wrong here, and our linter warns if we don't use it 
    const patternChange = prevProps.selectedPattern.name !== this.props.selectedPattern.name;
    if( patternChange )
    {
      this.sequences[prevProps.selectedPattern.name]._part.mute = true;
      this.schedulePlaybackForNewTracks();
    }
    const instrumentChange = prevProps.instrumentIndex !== this.props.instrumentIndex;
    if( instrumentChange )
    {
      for( const instrument of this.props.instrumentIndex )
      {
        this.samples[instrument.id].mute = instrument.muted;
      }
    }
  }

  tempoControl()
  {
    const onTempoChange = (event, tempo) => {
      this.setState( { tempo : tempo } );
      Tone.Transport.bpm.value = tempo;
    };
    return (
      <Slider
        defaultValue={100}
        min={60}
        step={1}
        max={180}
        onChange={onTempoChange}
        valueLabelDisplay="auto"
      />
    );

  }

  render() {
    const tempoControlColumns = 4;

    return (
      <React.Fragment>
        <div>
          <IconButton
            color="primary"
            aria-label="play"
            onClick={(e)=>{this.play();}}
          >
            <PlayArrowIcon />
          </IconButton>
          <IconButton
            color="secondary"
            aria-label="stop"
            onClick={(e)=>{this.stop();}}
          >
            <StopIcon />
          </IconButton>
        </div>

        <Grid container>
        <Grid item xs={(12 - tempoControlColumns) / 2} />
        <Grid item xs={tempoControlColumns}>
        {this.tempoControl()}
        </Grid>
        <Grid item xs={(12 - tempoControlColumns ) / 2} />
        </Grid>

      </React.Fragment>
   );
  }

};

export default ToneBoard;