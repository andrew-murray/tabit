import {findHCF} from "./data/utilities";

class Audio
{
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
        minResolution = findHCF( minResolution, t.getResolution() );
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

  static convertNormalToAudible(value){
    // add an intuitive feel to gain values, perception of sound is non-linear
    // https://www.dr-lex.be/info-stuff/volumecontrols.html
    // note: I tried x^4 and I tried using tone's DB directly but neither felt very good.
    return Math.pow(value, 2.5);
  }

  static convertAudibleToNormal(value){
    // we provide the inverse of the above, rarely useful
    return Math.pow(value, 1.0/2.5);
  }
}

export default Audio;