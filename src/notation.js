import SparseTrack from "./SparseTrack";
import Track from "./Track";
import {findHCF} from "./utilities"

class notation
{

  static DEFAULT_FORMAT_CONFIG = {
    "restMark" : "-",
    "beatMark" : "|",
    "undefinedMark" : "?",
    "lineMark" : "|",
    "numberRestMark" : "-",
    "beatResolution" : 48,
    "showBeatMark" : true,
    "showBeatNumbers" : true,
    "compactDisplay" : false,
    // lineResolution is typically determined on a per-pattern basis
    // however it used to be in here, and some tests still rely on this
    "lineResolution" : 48 * 8
  };

  static FORMAT_CONFIG_STRINGS = [
    ["restMark",["-", ".", " "]],
    ["numberRestMark",["-", ".", " "]],
    ["undefinedMark", ["?", "ø", "3", "4", "#", "+"]]
  ];

  static FORMAT_CONFIG_BOOLS = [
    "showBeatMark",
    "showBeatNumbers"
  ];

  static validateConfig(config, patternResolution) {
    if( patternResolution != null && ( config.beatResolution % patternResolution ) !== 0 )
    {
      throw new Error("patternResolution doesn't divide beatResolution");
    }
    if( config.lineResolution <= 0 )
    {
      throw new Error("config.lineResolution must be greater than zero");
    }
  }

  static resolveConfig(formatConfig)
  {
    for( const propName of Object.keys(formatConfig))
    {
      if(!notation.DEFAULT_FORMAT_CONFIG.hasOwnProperty(propName))
      {
        throw new Error("passed unrecognised property " + propName);
      }
    }

    return Object.assign( Object.assign({}, notation.DEFAULT_FORMAT_CONFIG), formatConfig );
  }

  static chunkString(str, chunkSize) {
    if( chunkSize <= 0 )
    {
      throw new Error("chunkSize must be > 0")
    }
    return str.match(new RegExp('.{1,' + chunkSize + '}', 'g'));
  }

  static chunkArray(a, chunkSize)
  {
    if( chunkSize <= 0 )
    {
      throw new Error("chunkSize must be > 0")
    }
    let chunks = [];
    for( let i = 0; i < a.length; i += chunkSize )
    {
      chunks.push( a.slice(i, Math.min( i + chunkSize, a.length) ) );
    }
    return chunks;
  }

  static createNumberMarker(numberRestMark, beatResolution, patternResolution, lineLength)
  {
    if( lineLength <= 0 )
    {
      throw new Error("lineLength <= 0");
    }

    if( ( beatResolution % patternResolution ) !== 0)
    {
      throw new Error("patternResolution " + patternResolution.toString() + " does not divide beatResolution " + beatResolution.toString());
    }

    let beatCount = Math.ceil(lineLength / beatResolution);
    let numberMarkerArray = Array.from( Array(lineLength / patternResolution), e => numberRestMark );

    for( let beat = 0; beat < beatCount; beat++ )
    {
      numberMarkerArray[ beat * ( beatResolution / patternResolution ) ] = ( (beat+1) % 10 ).toString();
    }
    return numberMarkerArray;
  }

  static formatLineWithMarkers(config, line, patternResolution, asHTML)
  {
    notation.validateConfig(config);

    const beatChunkSize = config.beatResolution / patternResolution;

    const padZero = (n, width) => {
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    };
    const formatSymbolAsSpans = (symbol, numericPosition) => {
      return "<span class='note-" + padZero(numericPosition, 4) + "'>" +  symbol + "</span>";
    };

    const formatSymbol = asHTML ? formatSymbolAsSpans : (symbol, numericPosition) => symbol;

    let formattedLine = "";
    for( let index = 0; index < line.length; ++ index )
    {
      const numericPosition = patternResolution * index;
      formattedLine += formatSymbol(line.charAt(index), numericPosition);
    }


    const lineWithBeats = config.showBeatMark ? notation.chunkString(formattedLine, beatChunkSize * formatSymbol("X", 0).length).join(config.beatMark) : formattedLine;
    // note: we choose to always show the lineMarker even if it doesn't match the line resolution
    return config.lineMark + lineWithBeats + config.lineMark;
  }

  static defaultLineResolution(
    trackDict,
    beatResolution
  )
  {
    const instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return 48 * 8;
    }
    const trackLength = instrumentTracks[0].length();
    const beatCount = trackLength / beatResolution;
    if( beatCount <= 12 )
    {
      return trackLength;
    }
    else if( beatCount > 32 )
    {
      return 48 * 16; // let's just be laazeee
    }
    else
    {
      // let's just apply a simple mapping, rather than think through logics
      const mapping = [
        trackLength, // 13
        trackLength / 2, // 14
        trackLength / 3, // 15
        trackLength / 2, // 16
        trackLength, // 17
        trackLength / 3, // 18
        trackLength, // 19
        trackLength / 4, // 20
        trackLength / 3, // 21
        trackLength / 2, // 22
        trackLength, // 23
        trackLength / 3, // 24
        trackLength / 5, // 25
        trackLength, // 26
        trackLength / 3, // 27
        trackLength / 4, // 28
        trackLength, // 29
        trackLength / 6, // 30
        trackLength, // 31
        trackLength / 4, // 32
      ];
      return mapping[ beatCount - 13 ];
    }
  }

  static getPatternLength(pattern)
  {
    let trackLength = 48;
    for(const [,t] of Object.entries(pattern.instrumentTracks))
    {
        trackLength = Math.max( trackLength, t.length() );
    }
    return trackLength;
  }

  static getPatternResolutionFromTracks(instrumentTracks)
  {
    let resolution = 48;
    for(const [,t] of Object.entries(instrumentTracks))
    {
        resolution = findHCF( resolution, t.getResolution() );
    }
    return resolution;

  }

  static getPatternResolution(pattern)
  {
    return notation.getPatternResolutionFromTracks(pattern.instrumentTracks);
  }

  static guessPerPatternSettings(
    trackDict,
    instruments
  )
  {
    const primaryResolution = notation.getPatternResolutionFromTracks(trackDict);
    return {
      "lineResolution" : notation.defaultLineResolution(trackDict, 48), // beatResolution (default)
      "beatResolution" : 48, // should cover all the cases hopefully
      "primaryResolution": primaryResolution,
      "individualResolutions" : [...Object.keys(instruments).map( k=>{return {index: k, name: instruments[k][0], resolution: primaryResolution};} )],
      "useIndividualResolution": false
    };
  }

  // it's not clear we can implement this function properly
  // static isCellUndefinedDense

  static formatPatternString(
    instrument,
    trackDict,
    restMark,
    undefinedMark
  )
  {
    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return "";
    }
    const exampleTrack = Array.from(Object.values(trackDict))[0];
    const patternResolution = exampleTrack.resolution;
    const patternSize = exampleTrack.length();
    const notationLength = patternSize / patternResolution;

    let patternArray = Array(notationLength).fill(restMark);
    let hitArray = Array(notationLength).fill(false);
    for( let charIndex = 0; charIndex < patternArray.length; ++charIndex)
    {
      // todo: deal with collions/bad resolutions
      for( const [trackID, trackSymbol] of Object.entries(instrument) )
      {
        const trackInstance = trackDict[trackID];
        if( trackInstance != null && trackInstance.rep[charIndex] === 1 )
        {
          if(hitArray[charIndex] === false)
          {
            patternArray[charIndex] = trackSymbol;
            hitArray[charIndex] = true;
          }
          else
          {
            patternArray[charIndex] = undefinedMark;
          }
        }
      }
    }
    return patternArray;
  }


  static isCellUndefinedSparse(
    instrument,
    trackDict,
    resolution,
    cell
  )
  {
    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return false;
    }
    const charLower = cell;
    const charHigher = cell + resolution;

    let previousHit = false;

    for( const trackID of Object.keys(instrument) )
    {
      const trackInstance = trackDict[trackID];
      // todo: countInRange? deal with collions/bad resolutions
      if( trackInstance !== null )
      {
        const notes = trackInstance.findAllInRange(charLower, charHigher);
        if(notes.length !== 0)
        {
          if(previousHit === false && notes.length === 1 && notes[0] === charLower)
          {
            previousHit = true;
          }
          else
          {
            return true;
          }
        }
      }
    }
    return false;
  }

  static formatPatternStringSparse(
    instrument,
    trackDict,
    restMark,
    undefinedMark,
    resolution
  )
  {
    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return "";
    }
    const exampleTrack = Array.from(Object.values(trackDict))[0];
    const patternSize = exampleTrack.length();
    // todo: here we are permissive, assume that resolution fits the patternSize
    const notationLength = patternSize / resolution;
    // it may become necessary to write a somewhat complex specialised algorithm here,
    // because it feels super slow not-to, but short-term, let's spew something out that works
    // this function may not stick around
    let patternArray = Array(notationLength).fill(restMark);
    let hitArray = Array(notationLength).fill(false);
    for( let charIndex = 0; charIndex < patternArray.length; ++charIndex)
    {
      const charLower = charIndex * resolution;
      const charHigher = (charIndex+1) * resolution;

      for( const [trackID, trackSymbol] of Object.entries(instrument) )
      {
        const trackInstance = trackDict[trackID];
        // todo: countInRange? deal with collions/bad resolutions
        if( trackInstance !== null )
        {
          const notes = trackInstance.findAllInRange(charLower, charHigher);
          if(notes.length !== 0)
          {
            if(hitArray[charIndex] === false && notes.length === 1 && notes[0] === charLower)
            {
              patternArray[charIndex] = trackSymbol;
              hitArray[charIndex] = true;
            }
            else
            {
              hitArray[charIndex] = true;
              patternArray[charIndex] = undefinedMark;
            }
          }
        }
      }
    }
    return patternArray;
  }

  static fromInstrumentAndTrack(
    instrument,
    trackDict,
    asHTML,
    formatConfig = {}
  )
  {
    const config = notation.resolveConfig(formatConfig);

    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return "";
    }

    // turn the tracks, into one char string
    const patternArray = notation.formatPatternString( instrument, trackDict, config.restMark, config.undefinedMark );
    const patternString = patternArray.join("");
    const patternResolution = instrumentTracks[0].resolution;
    const patternSize = instrumentTracks[0].length();

    // handle lines and beatMarkers
    let lineArray = notation.chunkString( patternString, config.lineResolution / patternResolution );

    let formattedLineArray = [];
    // add numbers on the first line
    if( config.showBeatNumbers )
    {
      formattedLineArray.push( notation.formatLineWithMarkers(
        config,
        notation.createNumberMarker(config.numberRestMark, config.beatResolution, patternResolution, Math.min(config.lineResolution, patternSize)).join(""),
        patternResolution,
        asHTML
      ) );
    }
    for( let i = 0; i < lineArray.length; ++i )
    {
      formattedLineArray.push( notation.formatLineWithMarkers( config, lineArray[i], patternResolution, asHTML ) );
    }

    return formattedLineArray.join("\n");
  }

  static clonePattern(name, pattern)
  {
    const trackArray = Object.keys(pattern.instrumentTracks).map(
      k => [k, pattern.instrumentTracks[k].clone()]
    );
    return {
      size: pattern.size,
      name: name,
      resolution: pattern.resolution,
      instrumentTracks: Object.fromEntries(trackArray)
    };
  }

  static createEmptyPattern(name, resolution, totalLength, trackKeys, sparse)
  {
    const createTrack = sparse ? ()=>{ return new SparseTrack( [], totalLength )}
                               : ()=>{ return Track.fromPositions( [], totalLength, resolution ); }
    const tracks = Object.fromEntries( new Map(
      Array.from(trackKeys).map(
        k => [k, createTrack()]
      )
    ) );
    return {
      size: totalLength,
      name: name,
      resolution: resolution,
      instrumentTracks: tracks
    };
  }

  static combinePatterns(name, patternA, patternB)
  {
    /* pattern = {
      size: int,
      name: string,
      resolution: int,
      instrumentTracks: {
        instrumentID (str) : track = { rep, resolution }
      }
    } */

    const resolution = Track.optimalResolution( patternA.resolution, patternB.resolution );
    const totalSize = patternA.size + patternB.size;
    const instrumentKeys = new Set( [...Object.keys(patternA.instrumentTracks), ...Object.keys(patternA.instrumentTracks)] );
    let instrumentTracks = {};
    for(const k of instrumentKeys)
    {
      instrumentTracks[k] = Track.combine(
        patternA.instrumentTracks[k],
        patternB.instrumentTracks[k],
        totalSize,
        resolution
      );
    }

    return {
      resolution: resolution,
      size: totalSize,
      name: name,
      instrumentTracks: instrumentTracks
    };
  }

};

export default notation;
