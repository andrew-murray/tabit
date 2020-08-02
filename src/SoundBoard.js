import React from 'react';
import Button from '@material-ui/core/Button';

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
    this.loopResolution = 1;
    this.trackLength = 1;
    this.soundTrack = [];
    this.loc = 0;
    this.timeInterval = 1;
    this.playing = false;
    this.populateSounds();
  }

  populateSounds()
  {
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
            this.sounds[selected_instrument.id] = new Audio(
              dest_url
            );
          }
        }
      }
    }
  }

  timeoutPlay()
  {
    this.loc = ( this.loc + this.loopResolution ) % this.trackLength;
    if( this.playing )
    {
      for( const o of this.soundTrack )
      {
        // const name = o[0];
        const id = o[1];
        const track = o[2]; 
        if(track.rep[this.loc / track.resolution] === 1)
        {
          this.sounds[id].currentTime=0;
          this.sounds[id].play();
        }
      }
      setTimeout((e)=>{ this.timeoutPlay(); }, this.timeInterval);
    }
  }

  play()
  {
    if(this.playing)
    {
      return;
    }

    const tempo = 100; // BPM (beats per minute)
    const beatTime =  (60.0 / tempo) * 1000;
    const timePerHydrogen = beatTime / 48.0;

    let minResolution = 48; 
    let trackLength = 48;
    this.soundTrack = [];

    this.populateSounds();

    for(const [id,t] of Object.entries(this.props.tracks))
    { 
      // the lookup and iteration shouldn't look like this
      const selected = this.props.instrumentIndex.filter(inst => inst.id.toString() === id);
      if( 
        selected.length > 0 
        && selected[0].id in this.sounds
        && !t.empty()
      )
      {
        const name = selected[0].name[0];
        this.soundTrack.push(
          [ name, selected[0].id, t]
        );
        minResolution = Math.min( minResolution, t.resolution );
        trackLength = Math.max( trackLength, t.length() );
      }
    }
    this.loopResolution = minResolution;
    this.timeInterval = minResolution * timePerHydrogen;
    this.trackLength =  trackLength;
    this.loc = - this.loopResolution;
    this.playing = true;
    this.timeoutPlay();
  }

  render() {
    return (
      <React.Fragment>
        <Button onClick={e=>{this.play();}}>Play</Button>
        <Button onClick={e=>{this.playing=false;}}>Stop</Button>
      </React.Fragment>
   );
  }
};

export default SoundBoard;