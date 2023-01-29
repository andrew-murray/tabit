import { compareArray, findHCF, zip } from "./utilities"


class SparseTrack
{
  constructor(points, length, velocity)
  {
    this.points = points;
    this.length_ = length;
    this.velocity = velocity;
  }

  length()
  {
    return this.length_;
  }

  empty()
  {
    return this.points.length === 0;
  }

  clone()
  {
    return new SparseTrack(
      this.points.slice(),
      this.length_,
      this.velocity.slice()
    );
  }

  toPoints()
  {
    return this.points;
  }

  getVelocities()
  {
    return this.velocity;
  }

  equals(other, checkVel)
  {
    return this.length() === other.length()
      && compareArray(this.points, other.points)
      && (!checkVel || compareArray(this.velocity, other.velocity));
  }

  findInsertionPoint(h)
  {
    // returns -1 if not present
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < h)
      {
        continue;
      }

      // we have reached a point >= h
      return i;
    }
    // still need this case, if all points < h
    return this.points.length;
  }

  queryPoint(h)
  {
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < h)
      {
        continue;
      }

      // we have reached a point >= h
      return this.points[i] === h;
    }
    // still need this case, if all points < h
    return false;
  }

  countInRange(lo, hi)
  {
    let count = 0;
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < lo)
      {
        continue;
      }
      else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // past the relevant range
      {
        return count;
      }
      else /*lo <= this.points[i] && this.points[i] < hi */
      {
        ++count;
      }
    }
    return count;
  }

  findAllInRange(lo, hi)
  {
    let found = [];
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < lo)
      {
        continue;
      }
      else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // past the relevant range
      {
        return found;
      }
      else /*lo <= this.points[i] && this.points[i] < hi */
      {
        found.push(this.points[i]);
      }
    }
    return found;
  }

  findPVInRange(lo,hi)
  {

      let found = [];
      for(let i = 0; i < this.points.length; ++i)
      {
        // fast-cast, keep skippin'
        if(this.points[i] < lo)
        {
          continue;
        }
        else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // past the relevant range
        {
          return found;
        }
        else /*lo <= this.points[i] && this.points[i] < hi */
        {
          found.push([this.points[i], this.velocity[i]]);
        }
      }
      return found;
  }

  getResolution()
  {
    const points = this.points;
    const relevantPoints = points.length > 0 && points[0] === 0 ? points.slice(1) : points;
    if(relevantPoints.length === 0)
    {
      return 48;
    }
    else if(relevantPoints.length === 1)
    {
      return relevantPoints[0];
    }
    else
    {
      let candidate = findHCF(relevantPoints[0], relevantPoints[1]);
      let problemPoints = relevantPoints.filter( p => p % candidate !== 0);
      while(problemPoints.length > 0)
      {
        const latestCandidate = findHCF(candidate, problemPoints[0]);
        problemPoints = relevantPoints.filter( p => p % latestCandidate !== 0);
        candidate = latestCandidate;
      }
      return candidate;
    }
  }

  queryRange(lo, hi)
  {
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < lo)
      {
        continue;
      }
      else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // skip passed the relevant range
      {
        return false;
      }
      else
      {
        return true;
      }
    }
    return false;
  }

  clearRange(lo, hi)
  {
    let loIndex = this.points.length;
    let hiIndex = this.points.length;
    for(let i = 0; i < this.points.length; ++i)
    {
      // fast-cast, keep skippin'
      if(this.points[i] < lo)
      {
        continue;
      }
      else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // skip passed the relevant range
      {
        hiIndex = i;
        break;
      }
      else
      {
        loIndex = Math.min(i, loIndex);
      }
    }
    // three cases,
    // [i] nothing to remove ... lo & hi == points.length
    //       - we splice the array, and delete "0"
    // [ii] something to remove, and there's a thing above the range too
    //       - we get a valid count here so splice and delete the appropriate number
    // [iii] something to remove ... and there's nothing above the range (so we remove until the end)
    //       - we need to remove everything after loIndex ... and the array will add up

    // need this check ... as we can "skip the relevant range"
    // and set hi but not lo
    if(loIndex < this.points.length)
    {
      this.points.splice(loIndex, hiIndex - loIndex);
      this.velocity.splice(loIndex, hiIndex - loIndex);
    }
  }

  static combine(a, b)
  {
    // This appends b to a

    // todo: Track.combine supports one-null track it's unclear why
    // at time-of-writing this function in SparseTrack
    // this only supports valid tracks else we'd have to complicate the interface
    if(!a || !b)
    {
      throw new Error("Can't combine null tracks");
    }
    const aLength = a.length();
    const points = a.toPoints().concat( b.toPoints().map(p => p + aLength));
    const vel = a.getVelocities().concat( b.getVelocities() );
    const totalLength = aLength + b.length();
    return new SparseTrack(points, totalLength, vel);
  }

  setPoint(h, value, velocity)
  {
    const ix = this.findInsertionPoint(h);
    if(ix < this.points.length && this.points[ix] === h)
    {
      // point is currently set
      if(value)
      {
        this.velocity[ix] = velocity;
        return;
      }
      else // setPoint to zero
      {
        // remove 1 element at position ix
        this.points.splice(ix, 1);
        this.velocity.splice(ix, 1);
      }
    }
    else
    {
      // point not present
      if(value)
      {
        // note that this works, even if we're inserting at the end
        this.points.splice(ix, 0, h);
        this.velocity.splice(ix, 0, velocity);
      }
      else
      {
        return; // no need to modify array, setting not-present point to not-present
      }
    }
  }

  isSparse()
  {
    return true;
  }

  isDense()
  {
    return !this.isSparse();
  }

  shrinkTo(length)
  {
    const locationOfLengthPoint = this.findInsertionPoint(length);
    return new SparseTrack(
      this.points.slice(0, locationOfLengthPoint),
      length,
      this.velocity.slice(0, locationOfLengthPoint)
    )
  }

  aggregate(other, expand)
  {
    // This treats a & b, as if they occur at the same time

    const length = expand ? Math.max( this.length_, other.length_ ) : this.length_;
    const output = new SparseTrack(
      this.points.slice(),
      length,
      this.velocity.slice()
    );
    for( const [p,v] of zip(other.points, other.velocity))
    {
      if(p >= length){ continue; }
      const existingIndex = output.points.indexOf(p);
      if(existingIndex === -1)
      {
        // todo: could implement something more direct, doesn't seem worthwhile
        output.setPoint( p, 1, v);
      }
      else
      {
        // make sure that if there are multiple points, we don't end up essentially
        // muting a part, for some reason
        const vel = Math.max(output.velocity[existingIndex], v);
        output.velocity[existingIndex] = vel;
      }
    }
    return output;
  }

}

export default SparseTrack;
