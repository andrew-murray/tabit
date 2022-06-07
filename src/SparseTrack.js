import { findHCF } from "./utilities"

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

  getResolution()
  {
    const points = this.points;
    if(points.length === 0)
    {
      return 48;
    }
    else if(points.length === 1)
    {
      return points[0] === 0 ? 48 : points[1];
    }
    else
    {
      const relevantPoints = points[0] === 0 ? points.slice(1) : points;
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

  setPoint(h, value)
  {
    const ix = this.findInsertionPoint(h);
    if(ix < this.points.length && this.points[ix] === h)
    {
      // already set
      return;
    }
    else
    {
      // note that this works, even if we're inserting at the end
      this.points.splice(ix, 0, h);
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