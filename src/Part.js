import React from 'react';
import notation from "./notation"
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    whiteSpace:"pre"
  },
});

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
    const patternResolution = tracks[0].resolution;
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
    const formatLine = (key, line, startBeat)=>{
      const beats = [...line.keys()];
      return (
        <p key={"pattern-line-" + key}>
          <span key={"line-start-" + key}>{this.props.config.lineMark}</span>
          {
            beats.map( beat => <React.Fragment key={"fragment-beat-"+ (beat + startBeat).toString()}>
              <span key={"span-beat-" + (beat + startBeat).toString()} className={(beat + startBeat) === this.props.activeNote ? "activeNote" : ""}>{line[beat].join("")}</span>
              <span key={"span-beat-marker-" + (beat + startBeat).toString()}>{(this.props.config.showBeatMark && beat !== beats[beats.length-1]) ? this.props.config.beatMark : ""}</span>
            </React.Fragment>
            )
          }
          <span key={"line-end-" + key}>{this.props.config.lineMark}</span>
        </p>
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
    return (
      <React.Fragment>
        {this.props.config.showBeatNumbers ? formatLine("beat", beatChunks, 0) : "" }
        {lineIndices.map(lineIndex=>formatLine(lineIndex.toString(), linesWithBeats[lineIndex], beatsPerLine * lineIndex))}
      </React.Fragment>
    );
  }
}

export default withStyles(useStyles)(Part);