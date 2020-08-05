import React from 'react';
import Button from '@material-ui/core/Button';
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

function surveySounds()
{
  for( const [b,v] of Object.entries(window.sounds) )
  {
    console.log( b.toString() + " sample rate " + v.sampleRate.toString() );
    console.log( b.toString() + " channels " + v.numberOfChannels.toString() );
    console.log( b.toString() + " duration " + v.duration.toString() );
    console.log( b.toString() + " length " + v.length.toString() );
  }
}

function createAudioBuffer(
  context,
  tracks,
  instrumentIndex,
  sounds,
  tempo
)
{
    const beatTime =  (60.0 / tempo) * 1000;
    const timePerHydrogen = beatTime / 48.0;

    let minResolution = 48; 
    let trackLength = 48;
    let soundTrack = [];
    for(const [id,t] of Object.entries(tracks))
    { 
      // the lookup and iteration shouldn't look like this
      const selected =  instrumentIndex.filter(inst => inst.id.toString() === id);
      if( 
        selected.length > 0 
        && selected[0].id in sounds
        && !t.empty()
      )
      {
        const name = selected[0].name[0];
        // not convinced this soundTrack object is useful anymore
        soundTrack.push(
          [ name, selected[0].id, t]
        );
        minResolution = Math.min( minResolution, t.resolution );
        trackLength = Math.max( trackLength, t.length() );
      }
    }

    // let's assume we can do some simple things

    const sampleRate = 44100;
    const channels = 2;
    const trackLengthMs = trackLength * timePerHydrogen;
    const trackLengthSamples = trackLengthMs * sampleRate / 1000.0;
    const totalSamples = Math.floor(trackLengthSamples);
    const samplesPerHydrogen = Math.floor( totalSamples / trackLength );
    const combined = context.createBuffer(channels, totalSamples, sampleRate);

    for (let channel = 0; channel < combined.numberOfChannels; channel++) {
      let combinedChannel = combined.getChannelData(channel);
      for(const [id,t] of Object.entries(tracks))
      { 
        // the lookup and iteration shouldn't look like this
        const selected =  instrumentIndex.filter(inst => inst.id.toString() === id);
        if( 
          selected.length > 0 
          && selected[0].id in sounds
          && !t.empty()
        )
        {
          const audioBuffer = sounds[selected[0].id];
          // fallback to copying the mono buffer across both channels
          const audioChannel = audioBuffer.numberOfChannels === 2 ? audioBuffer.getChannelData(channel) : audioBuffer.getChannelData(0);
          const trackPoints = t.toPoints();
          for( const noteStart of trackPoints )
          {
            const sampleStart = noteStart * samplesPerHydrogen;
            // console.log("inserting sample at " + sampleStart * (trackLengthBeats/trackLengthSamples));
            for( let sample = 0; sample < audioBuffer.length; ++sample )
            {
              // add sample to mega track
              combinedChannel[sampleStart + sample] = combinedChannel[sampleStart + sample] + audioChannel[sample];
            }
          }
        }
      }
    }

    let peakValue = 0.0;
    for (let channel = 0; channel < combined.numberOfChannels; channel++) {
      let combinedChannel = combined.getChannelData(channel);
      for( let sample = 0; sample < combinedChannel.length; ++sample)
      {
        peakValue = Math.max( Math.abs(combinedChannel[sample]), peakValue );
      }
    }

    if( peakValue > 1.0 )
    {
      for (let channel = 0; channel < combined.numberOfChannels; channel++) {
        let combinedChannel = combined.getChannelData(channel);
        for( let sample = 0; sample < combinedChannel.length; ++sample)
        {
          combinedChannel[sample] = combinedChannel[sample] / peakValue;
        }
      }
    }

    return combined;
}

function playBuffer(context, buffer)
{
  var source = context.createBufferSource();
  // set the buffer in the AudioBufferSourceNode
  source.buffer = buffer;
  source.loop=true;
  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(context.destination);
  // start the source playing
  source.start();
}

window.surveySounds = surveySounds;

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
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            const actx = window.audioContext;
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

    const actx = window.audioContext;
    const sounds = this.sounds;
    const instrumentIndex = this.props.instrumentIndex;
    const tracks = this.props.tracks;

    Promise.all(collatedPromises).then( () => {
      const b = createAudioBuffer(
        actx,
        tracks,
        instrumentIndex,
        sounds,
        100 // hardcoded tempo
      );
      window.audioBuffer = b;
      window.sounds = sounds;
      console.log(b);
    });
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
    playBuffer(window.audioContext, window.audioBuffer);
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