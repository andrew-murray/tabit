import React from 'react';
import Button from '@material-ui/core/Button';
import Audio from "./Audio"
import AudioRequest from "./AudioRequest";

// TODO: Licensing for hydrogen drumkits
// TODO: auto-generation of index

const  DRUMKITS = [
  "Boss_DR-110",
  "circAfrique v4",
  "DeathMetal",
  "JazzFunkKit",
  "The Black Pearl 1.0",
  "YamahaVintageKit",
  "GMkit",
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
      soundsPopulated : false
    }
    this.sounds = {};
    this.populateSounds();
  }

  populateSounds()
  {
    let collatedPromises = []; 
    for(const [id,] of Object.entries(this.props.tracks))
    {
      const selected = this.props.instrumentIndex.filter(inst => inst.id.toString() === id);
      if( selected.length > 0)
      {
        const selected_instrument = selected[0];
        if( DRUMKITS.includes(selected_instrument.drumkit) )
        {
          const filename = selected_instrument.filename.replace(".flac", ".wav");
          if(!(selected_instrument.id in this.sounds))
          {
            const dest_url = process.env.PUBLIC_URL + "/wav/" + selected_instrument.drumkit + "/" + filename;
            const actx = Audio.context;
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
    }

    const sounds = this.sounds;
    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.tracks;
    let board = this;

    Promise.all(collatedPromises).then( () => {
      const b = Audio.createMasterTrack(
        Audio.context,
        tracks,
        instrumentIndex,
        sounds,
        100 // hardcoded tempo
      );

      // todo: this could happen before componentDidMount!!
      board.setState( { audioBuffer : b, soundsPopulated : true } );
    });
  }

  stop()
  {
    // if playing, stop
    if(this.state.audioSource){
      this.state.audioSource.stop(); 
      this.setState( { audioSource : null } );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    const tracksAreDifferent = prevProps.tracks != this.props.tracks;
    if( tracksAreDifferent )
    {
      this.stop();
    }

    if( tracksAreDifferent &&  this.state.soundsPopulated)
    {
      // if( !this.state.soundsPopulated ) then we already have a task in flight to do this
      const b = Audio.createMasterTrack(
        Audio.context,
        this.props.tracks,
        this.props.instrumentIndex,
        this.sounds,
        100 // hardcoded tempo
      );


      this.setState({audioBuffer: b });

      // we were playing
      if( prevState.audioSource )
      {
        const source = Audio.createAudioSource( Audio.context, b );
        // kick it off immediately
        source.start();
        this.setState( { audioSource : source} );
      }
    }
  }

  render() {

    const play = (e) => {
      // if not playing, but buffer is ready
      if(!this.state.audioSource && this.state.audioBuffer)
      {
        const source = Audio.createAudioSource( Audio.context, this.state.audioBuffer );
        source.start();
        // element will start playing in componentDidUpdate
        this.setState( { audioSource : source} );
      }
    };

    return (
      <React.Fragment>
        <Button onClick={play}>Play</Button>
        <Button onClick={e=>{this.stop();}}>Stop</Button>
      </React.Fragment>
   );
  }
};

export default SoundBoard;