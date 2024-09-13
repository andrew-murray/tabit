// utilities.js

// todo: I'm a little suspicious this is needed
// it perhaps should be replaced by findHCF
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
      if( (p % b) !== 0 )
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


// stolen from https://studymaths.co.uk/topics/findingHCFWithJavaScript.php
function findHCF(x, y) {
  // If the input numbers are less than 1 return an error message.
  if (x < 1 || y < 1) {
    throw new Error("x<1 || y<1");
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

const compareArray = (a,b) => {
  if(a.length !== b.length)
  {
    return false;
  }
  for(let i = 0; i < a.length; ++i)
  {
    if(a[i] !== b[i])
    {
      return false;
    }
  }
  return true;
}

const zip = (a, b) => a.map((k, i) => [k, b[i]]);


export { calculateResolution, compareArray, findHCF, zip};
