import { calculateResolution } from "./utilities"

class track
{
  
  constructor(patternArray, resolution)
  {
    if(s.length == 0)
    {
      throw new Error("patternArray must not be zero length");
    }
    this.rep = patternArray;
    this.resolution = resolution;
  }

  length()
  {
    return this.rep.length * this.resolution;
  }

  static representPoints(points, resolution, size)
  {
    if( size <= 0 )
    {
      throw new Error("size must be greater than zero");
    }
    if( size < resolution || (size % resolution) != 0)
    {
      throw new Error("resolution must be less than size and divide it evenly");
    }
    let s = new Array(size / resolution).fill(0);
    for( const p of points )
    {
      if( (p % resolution) != 0)
      {
        throw new Error("Failed to represent point " + p.toString() + " at resolution " + resolution.toString());
      }
      if (p >= size)
      {
        throw new Error("Failed to represent point " + p.toString() + " for invalid specified size " + size.toString());
      }
      const arrayIndex = p / resolution;
      s[arrayIndex] = 1;
    }
    return s;
  }

  format(formatResolution)
  {
    // formatResolution must cleanly divide for every hit & the length of the pattern

    const totalLength = (this.resolution * this.rep.length);
    const points = this.toPoints();
    const rep = track.representPoints(points, formatResolution, size);
    if(!rep)
    {
      return null;
    }
    return new track(
      rep,
      formatResolution
    );
  }

  toPoints()
  {
    let points = [];
    for( const arrayIndex of Array(this.rep.length).keys() )
    {
      const indicator = this.rep[arrayIndex];
      if(indicator)
      {
        points.push( resolution * arrayIndex )
      }
    }
    return points;
  }

  static trackFromPositions(positions, size)
  {
    const resolution = calculateResolution( positions, size );
    return new track( 
      track.representPoints(positions, resolution, size), 
      resolution 
    );
  }
}

module.exports = track;
module.exports.default = track;