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
    this.sounds = {};
    this.buffer = null;
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
      board.masterTrack = b;
    });
  }

  play()
  {
    Audio.playBuffer(Audio.context, this.masterTrack);
  }

  render() {
    return (
      <React.Fragment>
        <Button onClick={e=>{this.play();}}>Play</Button>
        <Button onClick={e=>{}}>Stop</Button>
      </React.Fragment>
   );
  }
};

export default SoundBoard;