// utilities.js

function calculateResolution(positions, size)
{
  // hydrogen treats 48 as a beat
  const basesToTry = [
    48, // beat
    24, // 1/2 beat
    16, // 1/3 beat
    12, // 1/4
    8, // 1/6 
    6, // 1/8
    4, // 1/12
    3, // 1/16
    2, // 1/24
    1 // 1/48
  ];

  // note that, fundamentally the size of the pattern is a "keypoint"
  // that needs to be properly recorded by the resolution
  const implicitPositions = positions.concat( [size] );

  for( const b of basesToTry )
  {
    let allNotesPass = true;
    for( const p of implicitPositions )
    {
      if( (p % b) != 0 )
      {
        allNotesPass = false;
        break;
      }
    }
    if(allNotesPass)
    {
      return b;
    }
  }
  throw new Error("Failed to predict base");
}

exports.calculateResolution = calculateResolution;