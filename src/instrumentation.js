import track from "./track";

const DEFAULT_INSTRUMENT_SYMBOLS = {
  "Djembe Slap" : "S",
  "Djembe Tone" : "t",
  "Djembe Bass" : "O",
  "Snare Ghost" : "-",
  "Snare Accent" : "X",
  "Shaker Ghost" : "x",
  "Shaker Accent" : "X",
  "Click" : "X",
  "Bass" : "O",
  "Tom" : "O"
};

function normalizeInstrumentsForFiguring(instruments)
{
  let n = [];
  for(const inst of instruments)
  {
    let nInst = Object.assign({}, inst);
    // for some reason these instruments are one-size arrays, and one id ... the track id from hydrogen
    // this should be fixed, this doesn't make sense
    nInst.name = nInst.name[0].toLowerCase();
    n.push( nInst );
  }
  return n;
}

function figureDjembes(instrumentsRaw, symbolConfig)
{
  const instruments = normalizeInstrumentsForFiguring(instrumentsRaw);
  const djembeTracks = instruments.filter( (inst) => inst.name.includes("djembe") );
  if(djembeTracks.length == 0)
  {
    return [];
  }
  else if(djembeTracks.length <= 3)
  {
    // let's lazily assume we have a slap, tone, bass
    const slapArray = Array.from( djembeTracks, (inst) => inst.name.includes("slap") );
    const toneArray = Array.from( djembeTracks, (inst) => inst.name.includes("tone") );
    const bassArray = Array.from( djembeTracks, (inst) => inst.name.includes("bass") );
    for( let i = 0; i < djembeTracks.length; ++i )
    {
      let parityCheck = slapArray[i] + toneArray[i] + bassArray[i];
      // failed to figure out how djembes work return empty array
      if(parityCheck != 1)
      {
        return [];
      }
    }
    let djembeMapping = {};
    for( let i = 0; i < djembeTracks.length; ++i )
    {
      if( slapArray[i] )
      {
        djembeMapping[ djembeTracks[i].id.toString() ] = symbolConfig["Djembe Slap"];
      }
      else if( toneArray[i] )
      {
        djembeMapping[ djembeTracks[i].id.toString() ] = symbolConfig["Djembe Tone"];
      }
      else if( bassArray[i] )
      {
        djembeMapping[ djembeTracks[i].id.toString() ] = symbolConfig["Djembe Bass"];
      }
    }
    return [ { "Djembe" : djembeMapping } ];
  }
  else
  {
    // TODO: support more than one djembe
    return []
  }
}

function figureShakers(instrumentsRaw, symbolConfig)
{
  return [];
}

export { DEFAULT_INSTRUMENT_SYMBOLS, figureDjembes, figureShakers };