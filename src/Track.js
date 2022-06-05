import { calculateResolution } from "./utilities"

// stolen from https://studymaths.co.uk/topics/findingHCFWithJavaScript.php
function findHCF(x, y) {

   // If the input numbers are less than 1 return an error message.
   if (x < 1 || y < 1) {
    throw new Error("x<1 || y<1");
      // return "Please enter values greater than zero.";
   }

   // Now apply Euclid's algorithm to the two numbers.
   while (Math.max(x, y) % Math.min(x, y) !== 0) {
      if (x > y) {
         x %= y;
      }
      else {
         y %= x;
      }
   }

   // When the while loop finishes the minimum of x and y is the HCF.
   return Math.min(x, y);
}


class Track
{

  constructor(patternArray, resolution)
  {
    if(patternArray.length === 0)
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

  empty()
  {
    return this.rep.reduce( (a,b) => ( a + b ) ) === 0;
  }

  _sumOverlapsOfArrays(a,b)
  {
    let count = 0;
    for( let i = 0; i < a.length; ++i)
    {
      if(a[i] && b[i])
      {
        count++;
      }
    }
    return count;
  }

  getResolution()
  {
    return this.resolution;
  }

  queryPoint(h)
  {
    if((h % this.resolution) === 0)
    {
      return this.rep[ h / this.resolution];
    }
    return false;
  }

  setPoint(h, value)
  {
    if((h % this.resolution) === 0)
    {
      this.rep[ h / this.resolution ] = value;
    }
    else
    {
      // we don't support this yet, possibly unnecessary
      throw new Error("attempting to set point " + h.toString() + " but track has resolution " + this.resolution.toString());
    }
  }

  static optimalResolution(a,b)
  {
    return findHCF(a,b);
  }

  countOverlaps(other)
  {
    if( this.resolution === other.resolution )
    {
      return this._sumOverlapsOfArrays( this.rep, other.rep );
    }
    else
    {
      const hcf = Track.optimalResolution(this.resolution, other.resolution);
      const a = this.formatResolution( hcf );
      const b = other.formatResolution( hcf );
      return this._sumOverlapsOfArrays( a.rep, b.rep );
    }
  }

  aggregate(other)
  {

    if( this.resolution === other.resolution )
    {
      // when we aggregate, we specifically
      const length = Math.max( this.rep.length, other.rep.length );
      const pat = new Array(length).fill(0);
      for(let index = 0; index < pat.length; ++index)
      {
        pat[index] = ( ( index < this.rep.length ) ? this.rep[index] : 0 )
                  || ( ( index < other.rep.length ) ? other.rep[index] : 0 );
      }
      return new Track( pat, this.resolution );
    }
    else
    {
      const hcf = Track.optimalResolution(this.resolution, other.resolution);
      const a = this.formatResolution( hcf );
      const b = other.formatResolution( hcf );
      return a.aggregate(b);
    }
  }

  static representPoints(points, resolution, size)
  {
    if( size <= 0 )
    {
      throw new Error("size must be greater than zero");
    }
    if( size < resolution || (size % resolution) !== 0)
    {
      throw new Error("resolution must be less than size and divide it evenly");
    }
    let s = new Array(size / resolution).fill(0);
    for( const p of points )
    {
      if( (p % resolution) !== 0)
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

  compatible(formatResolution)
  {
    const points = this.toPoints();
    if(this.length() % formatResolution !== 0)
    {
      return false;
    }
    for(const point of points)
    {
      if( point % formatResolution !== 0)
      {
        return false;
      }
    }
    return true;
  }

  format(formatResolution)
  {
    // formatResolution must cleanly divide for every hit & the length of the pattern

    const totalLength = (this.resolution * this.rep.length);
    const points = this.toPoints();
    const rep = Track.representPoints(points, formatResolution, totalLength);
    if(!rep)
    {
      return null;
    }
    return new Track(
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
        points.push( this.resolution * arrayIndex )
      }
    }
    return points;
  }

  static fromPositions(positions, size, resolution = null)
  {
    const resolutionToUse = resolution ?? calculateResolution( positions, size );
    return new Track(
      Track.representPoints(positions, resolutionToUse, size),
      resolutionToUse
    );
  }

  static combine(a, b, size, resolution)
  {
    if(!a && !b)
    {
      throw new Error("Can't combine two null tracks");
    }
    if(!size || !resolution)
    {
      throw new Error("Need size and resolution parameters to be set");
    }
    const pointsA = a ? a.toPoints() : [];
    const sizeA = a ? a.length() : size - b.length();
    const pointsB = b ? b.toPoints().map(ix => ix + sizeA) : [];
    const allPoints = [ ...pointsA, ...pointsB ];
    return Track.fromPositions(allPoints, size, resolution);
  }

  clone()
  {
    return new Track( [...this.rep], this.resolution );
  }

  isSparse()
  {
    return false;
  }

  isDense()
  {
    return !this.isSparse();
  }
}

export default Track;
