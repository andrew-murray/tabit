
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
    "lineResolution" : 48 * 8
  };

  static FORMAT_CONFIG_STRINGS = [
    ["restMark",["-", ".", " "]],
    ["numberRestMark",["-", ".", " "]]
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
      throw new Error("config.lineResolution doesn't divide patternResolution");
    }
  }

  static chunkString(str, chunkSize) {
    if( chunkSize <= 0 )
    {
      throw new Error("chunkSize must be > 0")
    }
    return str.match(new RegExp('.{1,' + chunkSize + '}', 'g'));
  }

  // in javascript strings are immutable
  // various parts of this code, have to be fixed!

  static createNumberMarker(config, patternResolution, patternSize)
  {
    if( patternResolution <= 0 || patternSize <= 0 )
    {
      throw new Error("(patternResolution, patternSize) arguments <= 0");
    }
    if( ( patternSize % patternResolution) !== 0 )
    {
      throw new Error("patternSize,doesn't divide patternResolution");
    }

    notation.validateConfig(config, patternResolution);

    // note, this assumes that each line makes this match evenly
    // but ... there's nothing you can do in that case really
    const lineLength = Math.min(patternSize, config.lineResolution);
    let beatCount = Math.ceil(lineLength / config.beatResolution);

    let numberMarkerArray = Array.from( Array(lineLength / patternResolution), e => config.numberRestMark );

    for( let beat = 0; beat < beatCount; beat++ )
    {
      numberMarkerArray[ beat * ( config.beatResolution / patternResolution ) ] = ( (beat+1) % 10 ).toString();
    }
    return numberMarkerArray.join("");
  }

  static formatLineWithMarkers(config, line, patternResolution)
  {
    notation.validateConfig(config);

    const beatChunkSize = config.beatResolution / patternResolution;


    const lineWithBeats = config.showBeatMark ? notation.chunkString(line, beatChunkSize).join(config.beatMark) : line;
    // note: we choose to always show the lineMarker even if it doesn't match the line resolution
    return config.lineMark + lineWithBeats + config.lineMark;
  }

  static fromInstrumentAndTrack(
    instrument,
    trackDict,
    formatConfig = {}
  )
  {
    for( const propName of Object.keys(formatConfig))
    {
      if(!notation.DEFAULT_FORMAT_CONFIG.hasOwnProperty(propName))
      {
        throw new Error("passed unrecognised property " + propName);
      }
    }

    let config = Object.assign( Object.assign({}, notation.DEFAULT_FORMAT_CONFIG), formatConfig );

    let instrumentTracks = Object.values(trackDict);
    if(instrumentTracks.length === 0)
    {
      return "";
    }

    // turn the tracks, into one char string

    const patternSize = instrumentTracks[0].length();
    const patternResolution = instrumentTracks[0].resolution;
    const notationLength = instrumentTracks[0].length() / instrumentTracks[0].resolution;
    // we only format tracks to the correct resolution
    let patternArray = Array(notationLength).fill(config.restMark);
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
    const patternString = patternArray.join("");

    // handle lines and beatMarkers
    let lineArray = notation.chunkString( patternString, config.lineResolution );


    let formattedLineArray = [];
    // add numbers on the first line
    if( config.showBeatNumbers )
    {
      formattedLineArray.push( notation.formatLineWithMarkers( 
        config, 
        notation.createNumberMarker(config, patternResolution, patternSize), 
        patternResolution 
      ) );
    }
    for( let i = 0; i < lineArray.length; ++i )
    {
      formattedLineArray.push( notation.formatLineWithMarkers( config, lineArray[i], patternResolution ));
    }

    return formattedLineArray.join("\n");
  }
};

export default notation;