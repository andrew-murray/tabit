

class track
{
	
	constructor(s, resolution)
	{
		if(s.length == 0)
		{
			throw new Exception("problematic case")
		}
		this.rep = s;
		this.resolution = resolution;
	}

	length()
	{
		return this.s.length * this.resolution;
	}
}

module.exports = track;