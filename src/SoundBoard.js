import React from 'react';
import Audio from "./Audio"
import AudioRequest from "./AudioRequest";

import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import Slider from '@material-ui/core/Slider';

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

    const sounds = this.sounds;
    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.tracks;
    let board = this;

    Promise.all(collatedPromises).then( () => {
      const b = Audio.createMasterTrack(
        board.audioContext,
        tracks,
        instrumentIndex,
        sounds,
        100 // hardcoded tempo
      );

      // todo: this could happen before componentDidMount!!
      board.setState( { 
        audioBuffer : b, 
        resolution : Audio.determineMinResolution(instrumentIndex, tracks ),
        length : Audio.determineTrackLength(instrumentIndex, tracks ),
        soundsPopulated : true 
      } );
    });
  }

  stop()
  {
    // if playing, stop
    if(this.state.audioSource){
      this.state.audioSource.stop(); 
      if( this.timeoutID != null )
      {
        clearTimeout(this.timeoutID);
        this.timeoutID = null;
      }
      this.playPos = 0;
      this.setState( { audioSource : null } );
    }
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
      // if( !this.state.soundsPopulated ) then we already have a task in flight to do this
      const b = Audio.createMasterTrack(
        this.audioContext,
        this.props.tracks,
        this.props.instrumentIndex,
        this.sounds,
        100 // hardcoded tempo
      );

      this.setState({
        audioBuffer: b,
        resolution : Audio.determineMinResolution(this.props.instrumentIndex, this.props.tracks ),
        length : Audio.determineTrackLength(this.props.instrumentIndex, this.props.tracks )
      });

      // we were playing
      if( prevState.audioSource )
      {
        this.playBuffer( b );
      }
    }
  }

  componentDidMount()
  {
    this.populateSounds();
  }

  playBuffer( b )
  {

    const source = Audio.createAudioSource( this.audioContext, b, this.state.tempo );

    // kick it off immediately
    source.start();
    this.startTime = this.audioContext.currentTime;


    const tempo = 100.0;
    const beatTime =  (60.0 / tempo) / 4.0;

    
    const updatePlayPos = () => {
      const currentTime = this.audioContext.currentTime;
      const playPos = ( ( currentTime - this.startTime )  / this.state.audioBuffer.duration ) % 1.0;

      const beatCount = ( currentTime - this.startTime ) / beatTime;
      const currentBeat = Math.round(beatCount);
      const nextBeatTime = this.startTime + beatTime * ( currentBeat + 1 );

      this.timeoutID = setTimeout(
        updatePlayPos,
        Math.floor( ( nextBeatTime - Audio.context.currentTime ) * 1000 )
      );
      if( this.props.onPlaybackPositionChange  )
      {
        this.props.onPlaybackPositionChange( playPos );
      }
    };

    if( this.props.onPlaybackPositionChange )
    {
      updatePlayPos();
    }
    
    this.setState( { audioSource : source} );
  }
  
  tempoControl()
  {
    const onTempoChange = (event, tempo) => {
      if( this.state.audioSource )
      {
        // const playbackRate = tempo / 100.0;
        // fixme: avoid manipulating the state in place
        // this.state.audioSource.playbackRate.value = playbackRate;
      }
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
      // if not playing, but buffer is ready
      if(!this.state.audioSource && this.state.audioBuffer)
      {
        this.playBuffer(this.state.audioBuffer);
      }
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
        { // don't offer tempo controls yet, because it changes the pitch!
          false && this.tempoControl()
        }
      </React.Fragment>
   );
  }
};

export default SoundBoard;