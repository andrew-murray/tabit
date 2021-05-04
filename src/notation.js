import track from "./track";

class notation
{

  static DEFAULT_FORMAT_CONFIG = {
    "restMark" : "-",
    "beatMark" : "|",
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
    ["numberRestMark",["-", ".", " "]]
  ];

  static FORMAT_CONFIG_BOOLS = [
    "showBeatMark",
    "showBeatNumbers",
    "compactDisplay"
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

  static guessPerPatternSettings(
    trackDict
  )
  {
    return {
      "lineResolution" : notation.defaultLineResolution(trackDict, 48), // beatResolution (default)
      "beatResolution" : 48 // should cover all the cases hopefully
    };
  }

  static formatPatternString(
    instrument,
    trackDict,
    restMark
  )
  {
    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return "";
    }

    const patternSize = instrumentTracks[0].length();
    const patternResolution = instrumentTracks[0].resolution;
    const notationLength = patternSize / patternResolution;

    let patternArray = Array(notationLength).fill(restMark);
    for( let charIndex = 0; charIndex < patternArray.length; ++charIndex)
    {
      // todo: handle collisions
      for( const [trackID, trackSymbol] of Object.entries(instrument) )
      {
        const trackInstance = trackDict[trackID];
        if( trackInstance != null && trackInstance.rep[charIndex] === 1 )
        {
          patternArray[charIndex] = trackSymbol;
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
    const patternArray = notation.formatPatternString( instrument, trackDict, config.restMark );
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

  static getPatternLength(pattern)
  {
    let trackLength = 48;
    for(const [,t] of Object.entries(pattern.instrumentTracks))
    {
        trackLength = Math.max( trackLength, t.length() );
    }
    return trackLength;
  }

  static getPatternResolution(pattern)
  {
    let resolution = 48;
    for(const [,t] of Object.entries(pattern.instrumentTracks))
    {
        resolution = Math.min( resolution, t.resolution );
    }
    return resolution;
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

  static combinePatterns(name, patternA, patternB)
  {
    /* pattern = {
      size: int,
      name: string,
      notes: ...redundant,
      resolution: int,
      instrumentTracks: {
        instrumentID (str) : track = { rep, resolution }
      }
    } */

    const resolution = track.optimalResolution( patternA.resolution, patternB.resolution );
    const totalSize = patternA.size + patternB.size;
    window.patternA = patternA;
    window.patternB = patternB;
    const instrumentKeys = new Set( [...Object.keys(patternA.instrumentTracks), ...Object.keys(patternA.instrumentTracks)] );
    let instrumentTracks = {};
    for(const k of instrumentKeys)
    {
      instrumentTracks[k] = track.combine(
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
