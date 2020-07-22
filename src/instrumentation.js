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

// used by snare/shaker
function manageAccentOrGhost(instrumentTracks, instrumentName, accentSymbol, ghostSymbol)
{
  let outputInstruments = [];
  if(instrumentTracks.length == 2)
  {
    const t0 = instrumentTracks[0];
    const t1 = instrumentTracks[1];
    // attempt to determine ghost/accent
    const zeroLouder = t0.volume > t1.volume || (t0.volume == t1.volume && t0.gain > t1.gain);
    let mapping = {};
    mapping[ t0.id.toString() ] = zeroLouder ? accentSymbol : ghostSymbol;
    mapping[ t1.id.toString() ] = zeroLouder ? ghostSymbol : accentSymbol;
    let outputInstrument = {};
    outputInstrument[instrumentName] = mapping;
    outputInstruments.push( outputInstrument );
  }
  else // if 1 it must be an accent, if >= 3 ... I don't want to try and assign ghosts/accents
  {
    // I don't want to support ghost/accent here right now
    for( const track of instrumentTracks )
    {
      let mapping = {};
      mapping[ track.id.toString() ] = accentSymbol;
      let outputInstrument = {};
      outputInstrument[instrumentName] = mapping;
      outputInstruments.push(
        outputInstrument
      );
    }
  }
  return outputInstruments;

}

function figureShakers(instrumentsRaw, symbolConfig)
{
  const instruments = normalizeInstrumentsForFiguring(instrumentsRaw);
  // todo: support common alternative shakers? Tambourine?
  const shakerTracks = instruments.filter( (inst) => ( inst.name.includes("shaker") ) );
  return manageAccentOrGhost( 
    shakerTracks, 
    "Shaker", 
    symbolConfig["Shaker Accent"],
    symbolConfig["Shaker Ghost"]
  );
}

function figureSnares(instrumentsRaw, symbolConfig)
{
  const instruments = normalizeInstrumentsForFiguring(instrumentsRaw);
  const snareTracks = instruments.filter( (inst) => ( inst.name.includes("snare") ) );
  // todo: we currently assume 2 snares is accent/ghost ... but I think it's relatively
  // common to be 2 snare parts too, I think the algorithm here is check patterns to
  // see if they overlap ... if the "ghosts" overlap the "hits" sometimes, assume 2 parts
  return manageAccentOrGhost( 
    snareTracks, 
    "Snare", 
    symbolConfig["Snare Accent"],
    symbolConfig["Snare Ghost"]
  );
}

export { DEFAULT_INSTRUMENT_SYMBOLS, figureDjembes, figureShakers, figureSnares };