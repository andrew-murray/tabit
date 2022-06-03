
class SparseTrack
{
  constructor(points, length)
  {
    this.points = points;
    this.length = length;
  }

  length()
  {
    return this.length;
  }

  empty()
  {
    return this.points.length === 0;
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