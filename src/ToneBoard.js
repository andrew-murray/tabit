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
    this.patternDetails = {};
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
    for(const selectedInstrument of this.props.instrumentIndex)
    {
      const instrumentID = selectedInstrument.id.toString();
      if(
        "drumkit" in selectedInstrument && 
        "filename" in selectedInstrument &&
        DRUMKITS.includes(selectedInstrument.drumkit) )
      {
        const filename = selectedInstrument.filename.replace(".flac", ".wav");
        mapping[instrumentID] = new Tone.Player( 
          process.env.PUBLIC_URL + "/wav/" + selectedInstrument.drumkit + "/" + filename, 
          () => { this.samplerCount++; } 
        );
        mapping[instrumentID].connect(this.gain);
        this.expectedSamplerCount++;
      }
      else if( "drumkit" in selectedInstrument )
      {
        const relativeUrl = this.chooseAppropriateUrlForInstrument( selectedInstrument.drumkit, selectedInstrument.name );
        if(relativeUrl !== null)
        {
          mapping[instrumentID] = new Tone.Player( 
            process.env.PUBLIC_URL + "/wav/" + relativeUrl, 
            () => { this.samplerCount++; } 
          );
          mapping[instrumentID].connect(this.gain);
          this.expectedSamplerCount++;
        }
      }
    }
    this.samples = mapping;
  }

  createToneParts()
  {
    const instrumentIndex = this.props.instrumentIndex;
    // tone supports a dense array of events but its support isn't so great
    // from what it appears, so use the sparse interface (part)
    let patternParts = {};
    for( let p of this.props.patterns )
    {
      let parts = {};
      const tracks = p.instrumentTracks;
      const patternLength = Audio.determineTrackLength(instrumentIndex, p.instrumentTracks);
      const resolution = Audio.determineMinResolution(instrumentIndex, tracks );
      for(const [instrumentID,track] of Object.entries(tracks))
      {
        const id = instrumentID.toString();
        // hydrogen records things in (beat / 48) increments
        // tone supports  "4n" syntax to represent a quarter note
        // 4 * 48 == 192
        const hydrogenToTone = (h) =>{ return h * Tone.Time("192n"); };
        const originalPoints = track.toPoints();
        const tonePoints = originalPoints.map(hydrogenToTone);
        if( tonePoints.length > 0 )
        {
          parts[id] = new Tone.Part(
            (time) => { 
              this.samples[id].start(time); 
            },
            tonePoints
          );
          parts[id].mute = true;
          parts[id].start(0);
        }
      }
      patternParts[p.name] = parts;
      this.patternDetails[p.name] = {
        resolution: resolution,
        patternLength : patternLength
      };
    }
    return patternParts;
  }

  schedulePlaybackForNewTracks()
  {
    const length = this.patternDetails[this.props.selectedPattern.name].patternLength;

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
      this.setPatternMuted(this.props.selectedPattern.name, false);
      Tone.Transport.loop = true;
      Tone.Transport.setLoopPoints(0, Tone.Time("4n") * (length / 48.0));
    };
    if( queueTransition )
    {
      // log this, there seems to be some bugginess with some of the tone stuff
      // (my fault for not fully changing the code yet)
      // and this is more of an experimental feature
      console.log("queuing transition to pattern " + this.props.selectedPattern.name);
    }
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

  samplesReady()
  {
    return this.sampleCount === this.expectedSampleCount;
  }

  play()
  {
    // Tone.start is needed to be triggered from a user interaction
    // (web-audio-context policy of not playing until a user interaction)
    Tone.start().then(()=>{Tone.Transport.start();});
  }

  stop()
  {
    Tone.Transport.stop();
  }

  componentDidMount()
  {
    this.populateSamples();
    this.toneParts = this.createToneParts();
    this.schedulePlaybackForNewTracks();
  }

  setPatternMuted(patternName, muted)
  {
    for( let [, part] of Object.entries(this.toneParts[patternName]) )
    {
      part.mute = muted;
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    // theoretically we should be evaluating a rougher equality on the tracks here
    // but ... as is !== will never be wrong here, and our linter warns if we don't use it 
    const patternChange = prevProps.selectedPattern.name !== this.props.selectedPattern.name;
    if( patternChange )
    {
      this.setPatternMuted(prevProps.selectedPattern.name, true);
      this.schedulePlaybackForNewTracks();
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