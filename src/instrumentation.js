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
  "Tom" : "O",
  "Default" : "X"
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
  if(djembeTracks.length === 0)
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
      if(parityCheck !== 1)
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
    return [ [ "Djembe", djembeMapping ] ];
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
  if(instrumentTracks.length === 2)
  {
    const t0 = instrumentTracks[0];
    const t1 = instrumentTracks[1];
    // attempt to determine ghost/accent
    const zeroLouder = t0.volume > t1.volume || (t0.volume === t1.volume && t0.gain > t1.gain);
    let mapping = {};
    mapping[ t0.id.toString() ] = zeroLouder ? accentSymbol : ghostSymbol;
    mapping[ t1.id.toString() ] = zeroLouder ? ghostSymbol : accentSymbol;
    outputInstruments.push([instrumentName, mapping] );  
  }
  else // if 1 it must be an accent, if >= 3 ... I don't want to try and assign ghosts/accents
  {
    // I don't want to support ghost/accent here right now
    for( const track of instrumentTracks )
    {
      let mapping = {};
      mapping[ track.id.toString() ] = accentSymbol;
      outputInstruments.push([instrumentName, mapping] );  
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


function activeInstruments(patterns)
{
  let nonTrivialInstruments = new Set();
  for( const p of patterns )
  {
    for(const [instrumentID, part] of Object.entries(p.instrumentTracks))
    {
      if( !part.empty() )
      {
        nonTrivialInstruments.add(parseInt(instrumentID));
      }
    }
  }
  return nonTrivialInstruments;
}

function activeInstrumentation(instrumentIndex, patterns)
{
  const active = activeInstruments(patterns);
  let nonTrivialInstruments = [];
  for( const inst of instrumentIndex)
  {
    if( active.has(inst.id) )
    {
      nonTrivialInstruments.push( inst );
    }
  }
  return nonTrivialInstruments;
}

function countInstrumentOverlapForAllTracks(aid, bid, patterns)
{
  let count = 0;
  for( const p of patterns )
  {
    const aTrack = p.instrumentTracks[aid];
    const bTrack = p.instrumentTracks[bid];
    if( aTrack != null && bTrack != null )
    {
      count += aTrack.countOverlap( bTrack );
    }
  }
  return count;
}

function figureClickyInstruments(instrumentsRaw, symbolConfig, patterns)
{
  const instruments = normalizeInstrumentsForFiguring(instrumentsRaw);
  const worthwhileInstruments = activeInstruments(patterns);
  const relevantTracks = instruments.filter( (inst) => ( worthwhileInstruments.has(inst.id) &&
    !inst.name.includes("djembe") &&
    ( inst.name.includes("click") || 
    inst.name.includes("stick") || 
    inst.name.includes("tom") || 
    inst.name.includes("bass") ||
    inst.name.includes("kick") )
  ) );

  const trackIsClick = Array.from(
    relevantTracks,
    (t) => t.name.includes("click") || t.name.includes("stick")
  );
  // we rioritise the early tracks
  // and hope for the best

  let collated = [];
  for( let candidate = 0; candidate < Math.floor(relevantTracks.length/2); ++candidate )
  {
    if( trackIsClick[candidate*2] !== trackIsClick[candidate*2+1] )
    {
      const clickTrack = trackIsClick[candidate*2] ? relevantTracks[candidate*2] : relevantTracks[candidate*2+1];
      const hitTrack = trackIsClick[candidate*2] ? relevantTracks[candidate*2+1] : relevantTracks[candidate*2];
      const instrumentIsTom = hitTrack.name.includes("tom");
      const instrumentName = instrumentIsTom ? "Tom" : "Bass";
      let mapping = {};
      mapping[hitTrack.id.toString()] = symbolConfig[instrumentName];
      mapping[clickTrack.id.toString()] = symbolConfig["Click"];
      collated.push([instrumentName, mapping] );  
    }
  }

  // If there's a remainder instrument and there's no click
  if( ((relevantTracks.length % 2 ) !== 0) && !trackIsClick[ relevantTracks.length - 1 ] )
  {
    const lastTrack = relevantTracks[relevantTracks.length - 1];
    const instrumentName = lastTrack.name.includes("tom") ? "Tom" : "Bass";
    let mapping = {};
    mapping[lastTrack.id.toString()] = symbolConfig[instrumentName];
    collated.push([instrumentName, mapping] );  
  }

  return collated;
}

function figureInstruments(instrumentsRaw, symbolConfig, patterns)
{
  let output = [];
  output = output.concat( figureClickyInstruments( instrumentsRaw, symbolConfig, patterns ) );
  output = output.concat( figureDjembes( instrumentsRaw, symbolConfig ) );
  output = output.concat( figureSnares( instrumentsRaw, symbolConfig ) );
  output = output.concat( figureShakers( instrumentsRaw, symbolConfig ) );

  // we ignore track used by multiple instruments

  // but attempt to cover "instrument not recognised anywhere"

  const worthwhileInstruments = activeInstruments(patterns);

  for(const inst of instrumentsRaw)
  {
    if( !worthwhileInstruments.has(inst.id) )
    {
      continue;
    }
    let instrumentUsed = false;
    for( const op of output)
    {
      if( inst.id.toString() in op[1] ) 
      {
        instrumentUsed = true;
      }
    }
    if(instrumentUsed === false)
    {
      let mapping = {};
      mapping[ inst.id.toString() ] = symbolConfig["Default"];
      output.push( [inst.name[0], mapping] );
    }
  }
  
  return output; 
}

export { activeInstrumentation, DEFAULT_INSTRUMENT_SYMBOLS, figureClickyInstruments, figureDjembes, figureShakers, figureSnares, figureInstruments };