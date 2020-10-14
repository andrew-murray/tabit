import React from 'react';
import Audio from "./Audio"
import AudioRequest from "./AudioRequest";

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

class SoundBoard extends React.Component
{

  constructor(props) {
    super(props);
    this.state = {
      audioBuffer : null,
      audioSource : null,
      soundsPopulated : false,
      tempo : 100.0
    }
    this.sounds = {};
    this.audioContext = null;
    this.audioSources = null;
    Tone.Transport.bpm.value = 100.0;
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

  populateSounds()
  {
    if( this.audioContext === null )
    {
      // don't do this when creating components
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
      this.audioContext = Audio.createWebContext();
    }
    let collatedPromises = []; 
    for(const [id,] of Object.entries(this.props.tracks))
    {
      const selected = this.props.instrumentIndex.filter(inst => inst.id.toString() === id);
      if( selected.length > 0)
      {
        const selected_instrument = selected[0];
        // todo: many hydrogen drumkits are unsupported
        //       we should fallback to sensible defaults when the drumkit is not available
        //       rules for {tom, stick, shaker, kick, bass}
        if( 
          "drumkit" in selected_instrument && 
          "filename" in selected_instrument &&
          DRUMKITS.includes(selected_instrument.drumkit) )
        {

          const filename = selected_instrument.filename.replace(".flac", ".wav");
          if(!(selected_instrument.id in this.sounds))
          {
            const dest_url = process.env.PUBLIC_URL + "/wav/" + selected_instrument.drumkit + "/" + filename;
            const actx = this.audioContext;
            let sounds = this.sounds;
            collatedPromises.push( 
              AudioRequest.make( dest_url )
              .then( (response) =>{ return AudioRequest.parse(actx, response); } )
              .then( (buffer) => { sounds[selected_instrument.id] = buffer } )
              .catch( (fail) => { console.log(fail); })
            );
          }
        }
        else if( "drumkit" in selected_instrument )
        {
          // it's not a drumkit we support, try and guess a matching instrument
          const relativeUrl = this.chooseAppropriateUrlForInstrument( selected_instrument.drumkit, selected_instrument.name);
          if(relativeUrl === null )
          {
            console.log("didn't load anything for " + selected_instrument.name);
            continue;
          }
          const dest_url = process.env.PUBLIC_URL + "/wav/" + relativeUrl;
          const actx = this.audioContext;
          let sounds = this.sounds;
          collatedPromises.push(
            AudioRequest.make( dest_url )
            .then( (response) =>{ return AudioRequest.parse(actx, response); } )
            .then( (buffer) => { sounds[selected_instrument.id] = buffer } )
            .catch( (fail) => { console.log(fail); })
          );
        }
      }
    }

    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.tracks;
    let board = this;

    Promise.all(collatedPromises).then( () => {

      const resolution = Audio.determineMinResolution(instrumentIndex, tracks );
      const length = Audio.determineTrackLength(instrumentIndex, tracks );

      // todo: this could happen before componentDidMount!!
      board.setState( { 
        resolution : resolution,
        length : length,
        soundsPopulated : true 
      } );

      this.populateAudioSources();
      this.seq = new Tone.Sequence(
        (time,index) => { this.tick(time, index); },
        [...Array(length / resolution).keys()],
        Tone.Time("4n") * ( resolution / 48.0 )
      );
      this.seq.loop = true;
      this.seq.start(0);
    });

    document.soundboard = this;
  }

  resetAudioSources(index)
  {
      let hits = [];
      for(const [id,t] of Object.entries(this.props.tracks))
      {
        if( t.rep[index] )
        {
          hits.push(Audio.createOneShotAudioSource(this.audioContext, this.sounds[id], 100 ));
        }
      }
      this.audioSources[index] = hits;
  }

  populateAudioSources()
  {
    this.audioSources = new Array(this.state.length).fill(null);
    this.resetAudioSources(0);
  }

  tick(time,indexFromStart)
  {
    const trackLengthRes = ( this.state.length / this.state.resolution );
    const index = indexFromStart % trackLengthRes;
    // paranoid of tempo changes causing this to happen
    if(this.audioSources[index] === null)
    {
      this.resetAudioSources( index );
    }
    let sources = this.audioSources[index];
    // play!
    for( let source of sources )
    {
      source.start();
    }
    this.audioSources[index] = null;
    // set up the sources for so they're ready for the next time
    this.resetAudioSources( index ===  trackLengthRes - 1 ? 0 : index + 1 );
  }

  stop()
  {
    Tone.Transport.stop();
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    // theoretically we should be evaluating a rougher equality on the tracks here
    // but ... as is !== will never be wrong here, and our linter warns if we don't use it 
    const tracksAreDifferent = prevProps.tracks !== this.props.tracks;
    if( tracksAreDifferent )
    {
      this.stop();
    }

    if( tracksAreDifferent && this.state.soundsPopulated)
    {

      const resolution = Audio.determineMinResolution(this.props.instrumentIndex, this.props.tracks );
      const length = Audio.determineTrackLength(this.props.instrumentIndex, this.props.tracks);

      this.setState({
        resolution : resolution,
        length : length
      });

      this.populateAudioSources();
      this.seq = new Tone.Sequence(
        (time,index) => { this.tick(time, index); },
        [...Array(length/resolution).keys()],
        Tone.Time("4n") * ( resolution / 48.0 )
      );
      this.seq.loop = true;
      this.seq.start(0);
    }
  }

  componentDidMount()
  {
    this.populateSounds();
  }
  
  tempoControl()
  {
    const onTempoChange = (event, tempo) => {
      Tone.Transport.bpm.value = tempo;
    };
    return (
      <Slider
        defaultValue={this.state.tempo}
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

export default SoundBoard;