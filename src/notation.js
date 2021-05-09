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

  static assertStringContainsOnlyCharacters(
    s,
    allowed
  )
  {
    let stripped = s;
    for(const c of allowed)
    {
      stripped = stripped.split(c).join('');
    }
    console.assert(stripped.length === 0);
  }

  static parseTimeSignature(timeSignature)
  {
    const times = timeSignature.split("/");
    console.assert(times.length === 2);
    return [parseInt(times[0]), parseInt(times[1])];
  }

  static parseStandardForm(
    noteString,
    patternLengthString,
    enableTriplets,
    config,
    instrument // an instrument is a [name, {track_id: symbol}, metadata]
  )
  {
    console.assert(!enableTriplets);
    // let's just handle the simple case for now
    const instrumentSymbols = Object.values(instrument[1]);
    const allowed = [...instrumentSymbols, config.restMark, config.beatMark, config.lineMark ];
    if(noteString[0] !== config.lineMark || noteString[noteString.length - 1] !== config.lineMark )
    {
      // hint error
      return {
        "error" : "some problem occurred in some place"
      };
    }
    notation.assertStringContainsOnlyCharacters(noteString, allowed);
    // let's only handle one line at first
    const beats = noteString.substring(1,noteString.length - 1).split(config.beatMark);
    const timeSig = notation.parseTimeSignature(patternLengthString);

    // how do we assert stuff?

    // let's just deal with the easy 4/4 ish stuff

    if( timeSig[1] !== 2 && timeSig[1] !== 4 && timeSig[1] !== 8 )
    {
      return {
        "error" : "We only support time signatures where the lower number is {2,4,8}"
      };
    }
    const quarterNotesInSignature = timeSig[0] / ( timeSig[1] / 4 );
    // Let's just assume 4/4
    const strokesInBeats = beats.map( beat => beat.length );
    console.log(strokesInBeats);
    window.beats = beats;
    const strokeSet = new Set( strokesInBeats );

    console.log({
      quarterNotesInSignature: quarterNotesInSignature,
      strokeSet: strokeSet
    });

    if( (quarterNotesInSignature % 1 ) === 0 && strokeSet.size !== 1 )
    {
      return {
        "error" : "Each beat is expected to be written to the same resolution."
      };
    }
    else if( (quarterNotesInSignature % 1 ) !== 0 )
    {
      // need to check
      const strokesExcludingFinal = beats.slice(0,beats.length-1).map( beat => beat.length )
      const strokeSetExcludingFinal = Set( strokesExcludingFinal );
      if(strokeSetExcludingFinal.size !== 1)
      {
        return {
          "error" : "Each beat is expected to be written to the same resolution."
        };
      }
      else
      {
        // fixme: check the final beat conforms to the time signature's expectation
        return {
          "error": "Exotic time signatures are not yet supported (for some definition of exotic)"
        };
      }
    }

    // we have evenly written beats! let's create a pattern from them?

    const resolution = 48 / beats[0].length;
    // todo: ragged patterns?
    const patternLength = beats.length * 48;

    let instrumentTracks = new Map();
    for(const symbol of instrumentSymbols)
    {
      // const patternForSymbol = noteString.map( symbolEntry => symbolEntry == symbol);
      // instrumentTracks[symbol] =
    }

    return {
      "status" : "success"
    }
  }

  static isInstrumentLine(line)
  {
    return line[0] === "#" && line.substring(1).indexOf("#") === -1;
  }

  static instrumentTitleFromLine(line)
  {
    console.assert(notation.isInstrumentLine(line))
    const title = line.substring(1).trim();
    return title;
  }

  static classifyLine(line)
  {
    const trimmedLine = line.trim();
    if(trimmedLine.length === 0)
    {
      return "trivial";
    }
    else if(notation.isInstrumentLine(line))
    {
      return "instrument";
    }
    else if(line.indexOf("#") === -1)
    {
      return "tab";
    }
    return null;
  }

  static getRangesMatchingCondition(
    array,
    condition
  )
  {
    let leftOfRange = null;
    let outputRanges = [];
    for(let index = 0; index < array.length; ++index)
    {
      const matches = condition(array[index]);
      if(leftOfRange !== null && matches)
      {
        // do nothing, continue
      }
      else if(leftOfRange !== null && !matches)
      {
        // finalise range
        outputRanges.push( [leftOfRange, index] );
        leftOfRange = null;
      }
      else if(!leftOfRange && matches)
      {
        // start range
        leftOfRange = index;
      }
      else if(!leftOfRange && !matches)
      {
        // do nothing, nothing relevant to record
      }
      else
      {
        throw Error("tabit parser error: unexpected condition encountered in getRangesMatchingCondition");
      }
    }
    // if we've got an open-range waiting to be recorded
    if(leftOfRange !== null)
    {
      outputRanges.push( [leftOfRange, array.length]);
      // no need to set this but for consistency
      leftOfRange = null
    }
    return outputRanges;
  }

  static generateErrorFromLine(
    lineData,
    notationSymbolSet
  )
  {
    if(!lineData.class)
    {
      // try and guess what it was attempted to be
      const line = lineData.content;
      const trimmedLine = line.trim();
      if(trimmedLine.length === 0)
      {
        throw Error("tabit parser error: Failed to classify trivial line");
      }
      const indexOfLastHeader = line.lastIndexOf("#");
      if(indexOfLastHeader > 0)
      {
        return {
          "message": "Instrument declaration character '#' must start the line. Unexpected characters encountered.",
          "location": {
            "line": lineData.index,
            "characters": [0, indexOfLastHeader]
          }
        };
      }

      return {
        "message": "tabit parser errors: Failed to classify line " + lineData.index.toString(),
        "location": {
          "line": lineData.index,
          "characters": [0, lineData.content.length]
        }
      };
    }
    return null;
  }

  static findConfigurationErrorsForParsing(
    config,
    instruments
  )
  {
    let errorsToReturn = [];

    if(config.beatMark === config.restMark || config.lineMark === config.restMark)
    {
      errorsToReturn.push({
        "message": "restMark must be a distinct character from lineMark and beatMark for notation editing. " +
        "[restMark, beatMark,lineMark] are currently [" + [config.restMark, config.beatMark, config.lineMark].join(", ") + "]."
      });
    }

    if(config.beatMark === "#" || config.lineMark === "#" || config.restMark === "#")
    {
      const errorLocation = config.beatMark === "#" ? "beatMark"
                          : config.lineMark === "#" ? "lineMark"
                                                    : "restMark";
      errorsToReturn.push({
        "message": "When editing notation, '#' is a reserved character used for signifying an instrument's title. "
        + "It may not be used as part of other notation. It is currently used as " + errorLocation + "."
      });
    }

    const globalInstrumentSymbolArray = [].concat.apply( instruments.map( inst => Object.values(inst[1] ) ) );
    const globalInstrumentSymbolSet = new Set( globalInstrumentSymbolArray );
    if( globalInstrumentSymbolSet.has("#")
     // || globalInstrumentSymbolSet.has(config.restMark) // we allow rest mark to overlap the instrument set
     || globalInstrumentSymbolSet.has(config.beatMark)
     || globalInstrumentSymbolSet.has(config.lineMark))
    {
      errorsToReturn.push({
        "message": "Instruments use restricted symbols. Instruments may not use the restricted symbols [" +
          ["#", config.beatMark, config.restMark, config.lineMark].join(", ")
        + "]."
      });
    }

    const instrumentNames = instruments.map(inst => inst[0] );
    const instrumentNameSet = new Set(instrumentNames);
    const instrumentsStartOrEndWithWhitespace = instrumentNames.some(name => name !== name.trim());

    if(instrumentNameSet.size < instrumentNames.length
      || instrumentsStartOrEndWithWhitespace)
    {
      errorsToReturn.push({
        "message": "Instrument names must be unique and not start or end with whitespace. Current instrument names are [" + instrumentNames.join(", ") + "]."
      });
    }

    for(const inst of instruments)
    {
      // assert we don't have a one-to-many relationship for any characters
      const instrumentSymbolArray = Object.values(inst[1]);
      const instrumentSymbolSet = new Set(instrumentSymbolArray);
      if(instrumentSymbolSet.size < instrumentSymbolArray.length)
      {
        errorsToReturn.push({
          "message": "Instrument " + inst[0] + " has tracks that map to the same symbol. Its current symbol set is [" + instrumentSymbolArray.join(", ") + "]."
        });
      }
    }
    return errorsToReturn;
  }

  static errorsFromRepeatedInstruments(
    instrumentLines
  )
  {
    let instrumentSet = new Set();
    let errors = [];
    for( const iLine of instrumentLines )
    {
      const title = notation.instrumentTitleFromLine(iLine.content);
      if(instrumentSet.has(title))
      {
        errors.push({
          "message": "Instruments may not appear multiple times.",
          "location": {
            line: iLine.index,
            characters: [0, iLine.content.length]
          }
        })
      }
      instrumentSet.add(title);
    }
    return errors;
  }

  static validateInstrumentTitles(
    instruments,
    indexedLines
  )
  {
    let errorsToReturn = []
    const instrumentLines = indexedLines.filter(lineData => lineData.class === "instrument");
    const instrumentTitles = instruments.map( inst => inst[0] );
    const instrumentTitleSet = new Set( instrumentTitles );

    errorsToReturn = errorsToReturn.concat(
      notation.errorsFromRepeatedInstruments(instrumentLines)
    );
    for(const titleLine of instrumentLines )
    {
      // instrumentLines must start with # and not have any other # characters
      const title = notation.instrumentTitleFromLine(titleLine.content);
      if(!instrumentTitleSet.has(title))
      {
        errorsToReturn.push({
          "message": "Instrument name '" + title + "' is not recognized. Current instrument names are [" + instrumentTitles.join(", ") + "]."
        });
      }
    }
    return errorsToReturn;
  }

  static parseNotationLines(
    notationLines,
    patternLengthString,
    enableTriplets,
    config,
    instruments // an instrument is a [name, {track_id: symbol}, metadata]
  )
  {
    const globalErrors = notation.findConfigurationErrorsForParsing(
      config,
      instruments
    );
    if(globalErrors.length > 0)
    {
      return {
        "errors": globalErrors
      };
    }
    // index lines, because we may remove trivial lines
    const indexedLines = [...notationLines.keys()].map(index => {return {
      index: index,
      content: notationLines[index],
      class: notation.classifyLine(notationLines[index])
    }});

    const globalInstrumentSymbolArray = [].concat.apply( instruments.map( inst => Object.values(inst[1] ) ) );
    const globalSymbolArray = globalInstrumentSymbolArray.concat( [config.restMark, config.beatMark, config.lineMark ]);
    const globalInstrumentSymbols = new Set(globalSymbolArray) ;
    const errorsFromLineClassification = indexedLines.map(lineData=>notation.generateErrorFromLine(lineData, globalInstrumentSymbols)).filter(x => !!x);

    if(errorsFromLineClassification.length > 0)
    {
      return {"errors" : errorsFromLineClassification};
    }

    // asserts each instrument title appears only once and maps to a valid
    // instrument
    const errorsFromInstrumentTitles = notation.validateInstrumentTitles(
      instruments,
      indexedLines
    );

    if(errorsFromInstrumentTitles.length > 0)
    {
      return { "errors" : errorsFromInstrumentTitles };
    }

    const instrumentHeadingLineIndices = indexedLines
      .filter(lineData => lineData.class === "instrument")
      .map(lineData=>lineData.index);
    let instrumentSections = [];
    for(let headingIndex = 0; headingIndex < instrumentHeadingLineIndices.length; ++headingIndex)
    {
      const startIndex = instrumentHeadingLineIndices[headingIndex] + 1;
      const endIndex = headingIndex === instrumentHeadingLineIndices.length - 1 ? indexedLines.length
        : instrumentHeadingLineIndices[headingIndex+1];
      const instrumentLine = indexedLines[
        instrumentHeadingLineIndices[headingIndex]
      ];
      const title = notation.instrumentTitleFromLine(instrumentLine.content);
      const relevantInstruments = instruments.filter(inst => inst[0] === title);
      // this should have been handled earlier ... error hard here
      if(relevantInstruments.length !== 1)
      {
        throw Error("Could not find exactly one instrument for title '" + title + "'");
      }
      instrumentSections.push({
        "instrument": relevantInstruments[0],
        "title" : title,
        "startIndex": startIndex,
        "endIndex":  endIndex
      });
    }

    // check no notation appears before the first recognised section
    const untitledLines = indexedLines.filter(
      lineData => lineData.class === "tab" && lineData.index < instrumentSections[0].startIndex
    );
    if(untitledLines.length > 0)
    {
      const indices = untitledLines.map(lineData => lineData.index);
      return {
        "errors": [{
          "message" : "notation lines found before an instrument section. Lines [" + indices.join(", ") + "] were parsed as notation."
        }]
      };
    }

    let instrumentNotations = [];
    let errorsFromNotationParsing = [];
    for(let instrumentIndex = 0; instrumentIndex < instrumentSections; ++instrumentIndex)
    {
      const section = instrumentSections[instrumentIndex];
      const instrument = instrumentSections[instrumentIndex].instrument;
      let notationBits = [];
      for(let lineIndex = section.startIndex; lineIndex < section.endIndex; ++lineIndex)
      {
        if( indexedLines[lineIndex].class !== "tab" )
        {
          continue;
        }
        const parsedLine = notation.parseStandardForm(
          indexedLines[lineIndex].content,
          "4/4",
          enableTriplets,
          config,
          instrument // an instrument is a [name, {track_id: symbol}, metadata]
        );
        // we need to combine patterns... but managing
        // patternLength/timeSignature and all that jazz
        // is quite a faff
        if(parsedLine.errors && parsedLine.errors.length > 0)
        {
          errorsFromNotationParsing = errorsFromNotationParsing.concat(parsedLine.errors);
        }
        else
        {
          notationBits.push(parsedLine);
        }
      }
      // todo: support multiple lines?
      instrumentNotations.push({
        "instrument": instrument,
        "tracks": notationBits[0]
      })
    }
    return {"errors": errorsFromNotationParsing};
  }


};

export default notation;
