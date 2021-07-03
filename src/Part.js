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
    const linesWithBeats = patternLines.map(
      line => notation.chunkArray( line, beatChunkSize )
    );
    const lineIndices = [...patternLines.keys()];
    const Typo = this.props.dense ? DensePreTypography : PreTypography;
    const formatLine = (key, line, startBeats, prefix)=>{
      const beats = [...line.keys()];
      const makeClasses = beat => startBeats.map(sb => "partNote"+ (beat + sb).toString()).join(" ");
      return (
        <Typo key={"pattern-line-" + key} component="div">
          {prefix && <Typo variant="subtitle1" component="span" key={"line-prefix-" + key} style={{display: "inline-block"}}>{prefix}</Typo>}
          <Typo variant="subtitle1" component="span" key={"line-start-" + key} style={{display: "inline-block"}}>{this.props.config.lineMark}</Typo>
          {
            beats.map( beat => <React.Fragment key={"fragment-beat-"+ (beat + startBeats[0]).toString()}>
              <Typo variant="subtitle1" component="span" key={"span-beat-" + (beat + startBeats[0]).toString()} className={makeClasses(beat)} style={{display: "inline-block"}}>{line[beat].join("")}</Typo>
              <Typo variant="subtitle1" component="span" key={"span-beat-marker-" + (beat + startBeats[0]).toString()} style={{display: "inline-block"}}>{(this.props.config.showBeatMark && beat !== beats[beats.length-1]) ? this.props.config.beatMark : ""}</Typo>
            </React.Fragment>
            )
          }
          <Typo variant="subtitle1" component="span" key={"line-end-" + key}>{this.props.config.lineMark}</Typo>
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

    //const startBeatsForNumberLine =

    return (
      <div>
        {this.props.config.showBeatNumbers ? formatLine("beat", beatChunks, [0], prefixIndent) : "" }
        {lineIndices.map(lineIndex=>formatLine(lineIndex.toString(), linesWithBeats[lineIndex], [beatsPerLine * lineIndex], lineIndex === 0 ? this.props.prefix : prefixIndent))}
      </div>
    );
  }
}

export default withStyles(styles)(Part);
