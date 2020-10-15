import React from 'react';
import Audio from "./Audio"

import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import Slider from '@material-ui/core/Slider';
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
    this.gain = new Tone.Gain();
    this.gain.toDestination();
    this.seq = null;
    Tone.Transport.bpm.value = 100.0;
    document.board = this;
  }


  chooseAppropriateUrlForInstrument(drumkit_name, instrumentName)
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


  getSamplers()
  {
    this.samplerCount = 0;
    this.expectedSamplerCount = 0;
    let mapping = {};
    for(const [id,] of Object.entries(this.props.tracks))
    {
      const selected = this.props.instrumentIndex.filter(inst => inst.id.toString() === id);
      if( selected.length > 0)
      {
        const selected_instrument = selected[0];
        // todo: many hydrogen drumkits are unsupported
        //       we should fallback to sensible defaults when the drumkit is not available
        //       rules for {tom, stick, shaker, kick, bass}
        console.log(selected_instrument);
        if( 
          "drumkit" in selected_instrument && 
          "filename" in selected_instrument &&
          DRUMKITS.includes(selected_instrument.drumkit) )
        {
          const filename = selected_instrument.filename.replace(".flac", ".wav");
          mapping[selected_instrument.id] = new Tone.Player( 
            process.env.PUBLIC_URL + "/wav/" + selected_instrument.drumkit + "/" + filename, 
            () => { this.samplerCount++; } 
          );
          mapping[selected_instrument.id].connect(this.gain);
          console.log("mapped to " + selected_instrument.drumkit + "/" + filename);
          this.expectedSamplerCount++;
        }
        else if( "drumkit" in selected_instrument )
        {
          const relativeUrl = this.chooseAppropriateUrlForInstrument( selected_instrument.drumkit, selected_instrument.name );
          if(relativeUrl !== null)
          {
            mapping[selected_instrument.id] = new Tone.Player( 
              process.env.PUBLIC_URL + "/wav/" + relativeUrl, 
              () => { this.samplerCount++; } 
            );
          console.log("mapped to " + relativeUrl);
            mapping[selected_instrument.id].connect(this.gain);
            this.expectedSamplerCount++;
          }
          else
          {
            console.log("not mapped");
          }
        }
        else
        {
          console.log("not mapped");
        }
      }
    }
    return mapping;
  }

  schedulePlayback()
  {
    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.tracks;
    let board = this;

    const resolution = Audio.determineMinResolution(instrumentIndex, tracks );
    const length = Audio.determineTrackLength(instrumentIndex, tracks );

    // todo: this could happen before componentDidMount!!
    board.setState( { 
      resolution : resolution,
      length : length
    } );
    if( this.seq !== null )
    {
      this.seq.dispose();
    }
    this.seq = new Tone.Sequence(
      (time,index) => { this.tick(time, index); },
      [...Array(length / resolution).keys()],
      Tone.Time("4n") * ( resolution / 48.0 )
    );
    this.seq.loop = true;
    this.seq.start(0);
  }

  populateSounds()
  {
    this.samplers = this.getSamplers();
  }

  samplersReady()
  {
    return this.samplerCount === this.expectedSamplerCount;
  }

  tick(time,indexFromStart)
  {
    const trackLengthRes = ( this.state.length / this.state.resolution );
    const index = indexFromStart % trackLengthRes;
    if(!this.samplersReady())
    {
      return;
    }
    for(const [id,t] of Object.entries(this.props.tracks))
    {
        if( t.rep[index] )
        {
          this.samplers[id].start(time);
        }
    }
  }

  stop()
  {
    Tone.Transport.stop();
  }

  componentDidMount()
  {
    this.populateSounds();
    this.schedulePlayback();
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    // theoretically we should be evaluating a rougher equality on the tracks here
    // but ... as is !== will never be wrong here, and our linter warns if we don't use it 
    const tracksAreDifferent = prevProps.tracks !== this.props.tracks;
    const active = Tone.Transport.state === "started";
    if( tracksAreDifferent && active)
    {
      Tone.Transport.stop();
    }

    if( tracksAreDifferent)
    {
      this.schedulePlayback();
    }

    if( active )
    {
      Tone.Transport.start();
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

    const play = (e) => {
      Tone.Transport.start();
    };

    return (
      <React.Fragment>
        <div>
          <IconButton
            color="primary"
            aria-label="play"
            onClick={play}
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
        {
          this.tempoControl()
        }
      </React.Fragment>
   );
  }

};

export default ToneBoard;