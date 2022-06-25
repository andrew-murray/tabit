import { findHCF, calculateResolution } from "./utilities"

class SparseTrack
{
  constructor(points, length)
  {
    this.points = points;
    this.length_ = length;
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
      this.length_
    );
  }

  toPoints()
  {
    return this.points;
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
      else if(/*lo <= this.points[i] &&*/ this.points[i] >= hi) // skipp passed the relevant range
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

  static combine(a, b)
  {
    // todo: Track.combine supports one-null track
    // at time-of-writing this function in SparseTrack it's unclear why
    // this only supports valid tracks else we'd have to complicate the interface
    if(!a || !b)
    {
      throw new Error("Can't combine null tracks");
    }
    const aLength = a.length();
    const points = a.toPoints().concat( b.toPoints().map(p => p + aLength));
    const totalLength = aLength + b.length();
    return new SparseTrack(points, totalLength);
  }

  setPoint(h, value)
  {
    const ix = this.findInsertionPoint(h);
    if(ix < this.points.length && this.points[ix] === h)
    {
      // point is currently set
      if(value)
      {
        return;
      }
      else // setPoint to zero
      {
        // remove 1 element at position ix
        this.points.splice(ix, 1);
      }
    }
    else
    {
      // point not present
      if(value)
      {
        // note that this works, even if we're inserting at the end
        this.points.splice(ix, 0, h);
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

}

export default SparseTrack;