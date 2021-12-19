import React from 'react';
import notation from "./notation"
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

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
    if(tracks.length === 0 )
    {
      return <React.Fragment />
    }
    const patternArray = notation.formatPatternString(
      this.props.instrument,
      this.props.tracks,
      this.props.config.restMark
    );
    // don't support a multi-line pattern, that doesn't divide the beatResolution
    // because it's a nightmare!
    const exampleTrackID = Object.keys(this.props.instrument)[0]
    const patternResolution = this.props.tracks[exampleTrackID].resolution;
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
    // <Typo variant="subtitle1" component="span" key={"span-beat-" + (beat + startBeats[0]).toString()} className={makeClasses(beat)} style={{display: "inline-block"}}>{line[beat].map(c => <Button size="small" elementType="span" style={{display: "inline", marginBlock: 0, padding: 0, minWidth: 1, fontStretch: undefined}}>{c}</Button>)}</Typo>

    const formatLine = (key, line, startBeats, prefix, showRepeatCount, interactive)=>{
      const createBeatFragment = (beat) => {
        return <React.Fragment key={"fragment-beat-"+ (beat + startBeats[0]).toString()}>
          <Typo variant="subtitle1" component="span" key={"span-beat-" + (beat + startBeats[0]).toString()} className={makeClasses(beat)} style={{display: "inline-block"}}>
            {[...Array(line[beat].length).keys()].map(
              i => <Typo
                key={"beat-part-" + i.toString()}
                component="span"
                onClick={!interactive || !this.props.modifyPatternLocation ? undefined : ()=>{
                  const placesToEdit = startBeats.map( sb => ( (sb + beat) * this.props.config.beatResolution + i * patternResolution));
                  this.props.modifyPatternLocation(
                    placesToEdit,
                    this.props.instrument
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
    const repeatMatrix = countRepeats(patternLines);

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

export default withStyles(styles)(Part);
