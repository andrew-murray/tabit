import React from 'react';
import notation from "./notation"
import Typography from '@mui/material/Typography';
import { withStyles } from '@mui/styles';
import { isMobile } from "./Mobile";
import SparseTrack from "./SparseTrack";

const styles = (theme)=>({
  root: {
    fontFamily: "Roboto Mono",
    fontSize: '1.2rem',
    '@media (min-width:800px)': {
      fontSize: '1.4rem',
    }
  }
});

const denseStyles = (theme)=>({
  root: {
    fontFamily: "Roboto Mono",
    fontSize: '0.8rem',
    '@media (min-width:800px)': {
      fontSize: '1.1rem',
    }
  }
});

const PreTypography = withStyles(styles)(Typography);
const DensePreTypography = withStyles(denseStyles)(Typography);


const splitTracksIntoLines = (instrument, trackDict, lineResolution) =>
{
  const exampleTrack = Object.values(trackDict)[0];
  const totalLines = Math.ceil( exampleTrack.length() / lineResolution );
  let tracksByLine = [];
  for(let lineIndex = 0; lineIndex < totalLines; ++lineIndex)
  {
    const lineStart = lineResolution * lineIndex;
    const lineEnd = Math.min( lineStart + lineResolution, exampleTrack.length());
    const lineSize = lineEnd - lineStart;
    const tracksInRange = Object.fromEntries( Object.keys(instrument).map( instID => [instID, new SparseTrack(
      trackDict[instID].findAllInRange(lineStart, lineEnd).map((val)=>val - lineStart),
      lineSize
    )]));
    tracksByLine.push( tracksInRange );
  }
  return tracksByLine;
}

const countTrackRepeats = (tracksByLine) => {
  let repeatMatrix = {};
  let lineIndex = 0;
  while(lineIndex < tracksByLine.length)
  {
    // we always include the line itself
    let totalRepeats = 1;
    const baseTracks = tracksByLine[lineIndex];
    for(let compareIndex = lineIndex + 1; compareIndex < tracksByLine.length; ++compareIndex)
    {
      const compareTracks = tracksByLine[compareIndex];
      let allTracksEqual = true;
      for(const trackID of Object.keys(baseTracks))
      {
        // these tracks are all generated from the same set, so we need not worry about missing keys
        allTracksEqual &= baseTracks[trackID].equals( compareTracks[trackID] );
        if(!allTracksEqual)
        {
          break;
        }
      }
      if(allTracksEqual)
      {
        totalRepeats++;
      }
      else
      {
        break;
      }
    }
    repeatMatrix[ lineIndex ] = totalRepeats;
    lineIndex += totalRepeats;
  }
  return repeatMatrix;
}

class PartByBeat extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const tracks = Object.values(this.props.tracks);
    if(tracks.length === 0 || Object.keys(this.props.instrument).length === 0 )
    {
      return <React.Fragment />
    }
    const tracksAreSparse = tracks[0].isSparse();
    if(!tracksAreSparse)
    {
      if(tracks[0].resolution !== this.props.resolution)
      {
        throw new Error("Expected tracks with the correct resolution, when rendering dense patterns");
      }
    }
    // don't support a multi-line pattern, that doesn't divide the beatResolution
    // because it's a nightmare!
    if( (this.props.config.lineResolution % this.props.config.beatResolution) !== 0
        && ( tracks[0].length() > this.props.config.lineResolution ) )
    {
      throw new Error("This code only supports a beatResolution that divides the lineResolution");
    }

    const patternLength = tracks[0].length();
    const Typo = this.props.dense ? DensePreTypography : PreTypography;
    const tracksForEachLine = splitTracksIntoLines(this.props.instrument, this.props.tracks, this.props.config.lineResolution);
    const lineRepeatMatrix = countTrackRepeats(tracksForEachLine);
    const interactiveStyles = {
      cursor: "pointer"
    };

    // need a config override for this
    const notesInBeat = this.props.config.beatResolution / this.props.resolution;
    // todo: I think we should have "enableTriplet" and "enableDuplet"
    const candidateResolution = notesInBeat === 3 ? this.props.config.beatResolution / 2
                              : notesInBeat === 4 ? this.props.config.beatResolution / 3
                                                    : null;
    const useAlternativeResolution = this.props.config.smartTupletFormatting
                                  && candidateResolution !== null
                                  && Number.isInteger(candidateResolution)
                                  && ( candidateResolution % this.props.resolution ) !== 0;
    const tripletDupletMarker = notesInBeat === 4 ? "3 " : notesInBeat === 3 ? "2 " : "";
    const formatLine = (lineIndex, lineRepeats, prefix, showRepeatCount, interactive, numberMarker) =>
    {
      const lineStart = this.props.config.lineResolution * lineIndex;
      const lineEnd = Math.min( lineStart + this.props.config.lineResolution, patternLength);
      const lineSize = lineEnd - lineStart;
      const beatsOnMostLines = this.props.config.lineResolution / this.props.config.beatResolution;
      const beatsOnLine = lineSize / this.props.config.beatResolution;
      // since we're calculating the start of each line, we care about the lineResolution in general (rather than the remainder line)
      const startBeats = [...Array(lineRepeats).keys()].map( repeatIndex => (lineIndex + repeatIndex) * beatsOnMostLines);
      const makeClasses = beat => startBeats.map(sb => "partNote"+ (beat + sb).toString()).join(" ");
      const numberIndicator = numberMarker ? "-number" : "";
      const createBeatFragment = (beat) => {
        const editable = interactive && this.props.modifyPatternLocation;
        let renderedBeat = null;
        if(numberMarker)
        {
          renderedBeat = { content: [((beat+1) % 10).toString()].concat(Array(notesInBeat-1).fill(this.props.config.numberRestMark)) };
        }
        else
        {
          renderedBeat = notation.formatBeatSparse(
            this.props.instrument,
            tracksForEachLine[lineIndex],
            this.props.config.restMark,
            this.props.config.undefinedMark,
            this.props.resolution,
            useAlternativeResolution ? candidateResolution : null,
            // note we disregard lineResolution offsets, as we're passing tracks that have done the same
            beat * this.props.config.beatResolution,
            (beat+1) * this.props.config.beatResolution
          );
        }
        const lastNote = notesInBeat - 1;
        return <React.Fragment key={"fragment-beat-"+ (beat + startBeats[0]).toString() + numberIndicator}>
          <Typo
            variant="subtitle1"
            component="span"
            key={"span-beat-" + (beat + startBeats[0]).toString() + numberIndicator}
            className={makeClasses(beat)}
            style={{display: "inline-block"}}
          >
            {[...Array(renderedBeat.content.length).keys()].map( noteIndex => {
            return <Typo
                  key={"beat-part-" + noteIndex.toString() + numberIndicator}
                  component="span"
                  style={Object.assign( renderedBeat.alternative ? {textDecoration: "underline"} : {}, editable ? interactiveStyles : {})}
                  className={editable && !isMobile ? "hoverableNote" : undefined}
                  onClick={!editable? undefined : ()=>{
                    const resolution = renderedBeat.alternative ? candidateResolution : this.props.resolution;
                    const placesToEdit = startBeats.map( sb => ( (sb + beat) * this.props.config.beatResolution + noteIndex * resolution));
                    this.props.modifyPatternLocation(
                      placesToEdit,
                      this.props.instrument,
                      // this resolution is only used to check if we're attempting to modify an undefined cell
                      // so it's correct to pass alternative, if we're rendering alternative and normal, if we're rendering normal
                      resolution
                    );
                  }}
            >
              {renderedBeat.content[noteIndex]}
            </Typo>
            })}
            { (useAlternativeResolution && renderedBeat.alternative) && <Typo
                  key={"beat-part-" + lastNote.toString() + numberIndicator}
                  component="span"
                  // while the gap is meaningless and can't be editable, we leave the cursor style on
                  style={editable ? interactiveStyles : undefined}
                  // but disable the highlight
                  // className={editable && !isMobile ? "hoverableNote" : undefined}
            >
            <sub style={{display: "inline", verticalAlign: "bottom", fontSize: "50%"}}>{tripletDupletMarker}</sub>
            </Typo>
            }
          </Typo>
          <Typo variant="subtitle1" component="span" key={"span-beat-marker-" + (beat + startBeats[0]).toString() + numberIndicator} style={{display: "inline-block"}}>
            {(this.props.config.showBeatMark && (beat !== beatsOnLine - 1)) ? this.props.config.beatMark : ""}
          </Typo>
        </React.Fragment>
      };
      return (
        <Typo key={"pattern-line-" + lineIndex} component="div">
          {prefix && <Typo variant="subtitle1" component="span" key={"line-prefix-" + lineIndex} style={{display: "inline-block"}}>{prefix}</Typo>}
          <Typo variant="subtitle1" component="span" key={"line-start-" + lineIndex} style={{display: "inline-block"}}>{this.props.config.lineMark}</Typo>
          {
            [...Array(beatsOnLine).keys()].map( beatIndex => createBeatFragment(beatIndex) )
          }
          <Typo variant="subtitle1" component="span" key={"line-end-" + lineIndex}>{this.props.config.lineMark}</Typo>
          {showRepeatCount && <Typo variant="subtitle1" component="span" key={"rep-marker"}>x{startBeats.length.toString()}</Typo>}
        </Typo>
      );
    };

    const prefixIndent = this.props.prefix ? ' '.repeat(this.props.prefix.length) : null;
    const showRepeatCount = Object.values(lineRepeatMatrix).some( (x) => (x > 1) );
    return (<div>
        {this.props.config.showBeatNumbers && formatLine(
          0,
          tracksForEachLine.length,
          prefixIndent,
          false, // showRepeatCount,
          false, // interactive todo: is this right?
          true // numberMarker
        )}
        {Object.entries(lineRepeatMatrix).map(([lineIndex, lineRepeats], keyIndex) => formatLine(
          parseInt(lineIndex),
          lineRepeats,
          lineIndex === "0" ? this.props.prefix : prefixIndent,
          showRepeatCount,
          true, // interactive
          false // numberMarker
        ))}
    </div>);
  }
};
/*
const countRepeats = (patternLines) => {
  let repeatMatrix = [];
  for(let lineIndex = 0; lineIndex < patternLines.length; ++lineIndex)
  {
    let totalRepeats = 1;
    for(let compareIndex = lineIndex + 1; compareIndex < patternLines.length; ++compareIndex)
    {
      const comp = compareArray(patternLines[lineIndex], patternLines[compareIndex]);
      if(comp)
      {
        totalRepeats++;
      }
      else
      {
        break;
      }
    }
    repeatMatrix.push(totalRepeats);
  }
  return repeatMatrix;
};
class Part extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const tracks = Object.values(this.props.tracks);
    if(tracks.length === 0 || Object.keys(this.props.instrument).length === 0 )
    {
      return <React.Fragment />
    }
    const tracksAreSparse = tracks[0].isSparse();
    if(!tracksAreSparse)
    {
      if(tracks[0].resolution !== this.props.resolution)
      {
        throw new Error("Expected tracks with the correct resolution, when rendering dense patterns");
      }
    }
    const patternResolution = this.props.resolution;
    let patternArray = null;
    if(tracksAreSparse)
    {
      patternArray = notation.formatPatternStringSparse(
        this.props.instrument,
        Object.fromEntries(Object.entries(this.props.tracks).filter(([key]) => key in this.props.instrument)),
        this.props.config.restMark,
        this.props.config.undefinedMark,
        this.props.resolution
      );
    }
    else
    {
      patternArray = notation.formatPatternString(
        this.props.instrument,
        Object.fromEntries(Object.entries(this.props.tracks).filter(([key]) => key in this.props.instrument)),
        this.props.config.restMark,
        this.props.config.undefinedMark
      );
    }
    // don't support a multi-line pattern, that doesn't divide the beatResolution
    // because it's a nightmare!
    if( (this.props.config.lineResolution % this.props.config.beatResolution) !== 0
        && ( patternArray.length * patternResolution > this.props.config.lineResolution ) )
    {
      throw new Error("This code only supports a beatResolution that divides the lineResolution");
    }
    // this code has got very convoluted
    const patternLines = notation.chunkArray(patternArray, this.props.config.lineResolution / patternResolution, 0);
    const beatsPerLine = this.props.config.lineResolution / this.props.config.beatResolution;
    const beatChunkSize = this.props.config.beatResolution / patternResolution;
    const lineIndices = [...patternLines.keys()];
    const Typo = this.props.dense ? DensePreTypography : PreTypography;
    const interactiveStyles = {
      cursor: "pointer"
    };

    // todo: this needs to be re-architected into "do something for each-beat"
    // rather than this pre-generate the string and split it up

    const formatLine = (key, line, startBeats, prefix, showRepeatCount, interactive)=>{
      const createBeatFragment = (beat) => {
        const editable = interactive && this.props.modifyPatternLocation;
        return <React.Fragment key={"fragment-beat-"+ (beat + startBeats[0]).toString()}>
          <Typo variant="subtitle1" component="span" key={"span-beat-" + (beat + startBeats[0]).toString()} className={makeClasses(beat)} style={{display: "inline-block"}}>
            {[...Array(line[beat].length).keys()].map(
              i => <Typo
                key={"beat-part-" + i.toString()}
                component="span"
                style={editable ? interactiveStyles : undefined}
                className={editable && !isMobile ? "hoverableNote" : undefined}
                onClick={!editable? undefined : ()=>{
                  // FIXME: this has to adapt for alternativeResolution
                  const placesToEdit = startBeats.map( sb => ( (sb + beat) * this.props.config.beatResolution + i * patternResolution));
                  this.props.modifyPatternLocation(
                    placesToEdit,
                    this.props.instrument,
                    patternResolution
                  );
                }}>
                  {line[beat][i]}
              </Typo>
              )
            }
          </Typo>
          <Typo variant="subtitle1" component="span" key={"span-beat-marker-" + (beat + startBeats[0]).toString()} style={{display: "inline-block"}}>{(this.props.config.showBeatMark && beat !== beats[beats.length-1]) ? this.props.config.beatMark : ""}</Typo>
        </React.Fragment>
      }
      const beats = [...line.keys()];
      const makeClasses = beat => startBeats.map(sb => "partNote"+ (beat + sb).toString()).join(" ");
      return (
        <Typo key={"pattern-line-" + key} component="div">
          {prefix && <Typo variant="subtitle1" component="span" key={"line-prefix-" + key} style={{display: "inline-block"}}>{prefix}</Typo>}
          <Typo variant="subtitle1" component="span" key={"line-start-" + key} style={{display: "inline-block"}}>{this.props.config.lineMark}</Typo>
          {
            beats.map( createBeatFragment )
          }
          <Typo variant="subtitle1" component="span" key={"line-end-" + key}>{this.props.config.lineMark}</Typo>
          {showRepeatCount && <Typo variant="subtitle1" component="span" key={"rep-marker"}>x{startBeats.length.toString()}</Typo>}
        </Typo>
      );
    };

    const numberLine = notation.createNumberMarker(
      this.props.config.numberRestMark,
      this.props.config.beatResolution,
      patternResolution,
      Math.min( this.props.config.lineResolution, patternLines[0].length * patternResolution )
    );
    const beatChunks = notation.chunkArray(
      numberLine,
      this.props.config.beatResolution / patternResolution
    );
    const prefixIndent = this.props.prefix ? ' '.repeat(this.props.prefix.length) : null;
    // todo: this is a very dumb way to implement this feature, probably slower than it need be
    const repeatMatrix = this.props.config.expandRepeatedLines ? new Array(patternLines.length).fill(1) : countRepeats(patternLines);

    const lineElements = [];
    let lineIndex = 0;
    // disable showing a repeat count if it would be labelling every line with a x1
    const someLinesMatch = repeatMatrix.reduce((partial_sum, to_add) => partial_sum + to_add, 0) > repeatMatrix.length;
    while(lineIndex < repeatMatrix.length)
    {
      const startPoint = beatsPerLine * lineIndex;
      const startBeats = [...Array(repeatMatrix[lineIndex]).keys()].map(repeatLine => startPoint + repeatLine * beatsPerLine);
      // we could inject user-preferences here
      // two possible suggestions
      // "never"
      // "only for line one" ... as ABBC patterns mightlook pretty confusing I reckon
      // "always"
      const showRepeats = someLinesMatch;
      lineElements.push(
        formatLine(lineIndex.toString(), notation.chunkArray(patternLines[lineIndex], beatChunkSize), startBeats, lineIndex === 0 ? this.props.prefix : prefixIndent, showRepeats, true)
      );
      lineIndex += startBeats.length;
    }

    return (
      <div>
      {this.props.config.showBeatNumbers ? formatLine("beat", beatChunks, lineIndices.map(lineIndex=>lineIndex * beatsPerLine), prefixIndent, false, false) : "" }
      {lineElements}
      </div>
    );
  }
}
*/
// export default withStyles(styles)(Part);
export default withStyles(styles)(PartByBeat);
