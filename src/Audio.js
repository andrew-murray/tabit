class Audio
{

  // todo: we replace a valid audioContext with a blank object, so that we can run tests in node
  //       this should probably be replaced by https://github.com/audiojs/web-audio-api 
  //       and a test-suite written
  static createWebContext()
  {
    return new (window.AudioContext || window.webkitAudioContext || Object)();
  }

  static determineMinResolution(
    instrumentIndex,
    tracks
  )
  {
      let minResolution = 48; 
      for(const [id,t] of Object.entries(tracks))
      { 
        // the lookup and iteration shouldn't look like this
        const selected =  instrumentIndex.filter(inst => inst.id.toString() === id);
        if( 
          selected.length > 0 
          && !t.empty()
        )
        {
          minResolution = Math.min( minResolution, t.resolution );
        }
      }
      return minResolution;
  }

  static determineTrackLength(
    instrumentIndex,
    tracks
  )
  {
      let trackLength = 48;
      for(const [id,t] of Object.entries(tracks))
      { 
        // the lookup and iteration shouldn't look like this
        const selected =  instrumentIndex.filter(inst => inst.id.toString() === id);
        if( 
          selected.length > 0 
          && !t.empty() 
        )
        {
          trackLength = Math.max( trackLength, t.length() );
        }
      }
      return trackLength;
  }

  static peakAmplitude(
    combined
  )
  {
    let peakValue = 0.0;
    for (let channel = 0; channel < combined.numberOfChannels; channel++) {
      let combinedChannel = combined.getChannelData(channel);
      for( let sample = 0; sample < combinedChannel.length; ++sample)
      {
        peakValue = Math.max( Math.abs(combinedChannel[sample]), peakValue );
      }
    }
    return peakValue;
  }

  static normalizeAudioBuffer(
    combined
  )
  {
    const peakValue = Audio.peakAmplitude( combined );
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

  static createMasterTrack(
    context,
    tracks,
    instrumentIndex,
    sounds,
    tempo
  )
  {
    const trackLength = Audio.determineTrackLength( instrumentIndex, tracks );


    const beatTime =  (60.0 / tempo) * 1000;
    const timePerHydrogen = beatTime / 48.0;


    // let's assume we can do some simple things

    const sampleRate = 44100;
    const channels = 2;
    const trackLengthMs = trackLength * timePerHydrogen;
    const trackLengthSamples = trackLengthMs * sampleRate / 1000.0;
    const totalSamples = Math.floor(trackLengthSamples);
    const samplesPerHydrogen = Math.floor( totalSamples / trackLength );
    const combined = context.createBuffer(channels, totalSamples, sampleRate);

    // populate blank buffer with sounds
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
            for( let sample = 0; sample < audioBuffer.length; ++sample )
            {
              // add sample to mega track
              combinedChannel[sampleStart + sample] = combinedChannel[sampleStart + sample] + audioChannel[sample];
            }
          }
        }
      }
    }

    return Audio.normalizeAudioBuffer( combined );
  }

  static createAudioSource(context, buffer, tempo)
  {
    var source = context.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    source.buffer = buffer;
    source.loop=true;
    if( tempo !== null )
    {
      source.playbackRate.value = tempo / 100.0;
    }
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(context.destination);
    return source;
  }
  static createOneShotAudioSource(context, buffer, tempo)
  {
    var source = context.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    source.buffer = buffer;
    source.loop=false;
    if( tempo !== null )
    {
      source.playbackRate.value = tempo / 100.0;
    }
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(context.destination);
    return source;
  }
}

export default Audio;