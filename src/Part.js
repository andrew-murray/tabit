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
    const patternResolution = tracks[0].resolution;
    const patternLines = notation.chunkArray(patternArray, this.props.config.lineResolution / patternResolution);
    const lineIndices = [...patternLines.keys()];
    const linesWithBeats = patternLines.map(
      line => notation.chunkArray( line, this.props.config.beatResolution / patternResolution )
    );
    const formatLine = (key, line)=>{
      const beats = [...line.keys()];
      return (
        <p key={"pattern-line-" + key}>
          <span key={"line-start-" + key}>{this.props.config.lineMark}</span>
          {
            beats.map( beat => <React.Fragment key={"fragment-beat-"+ beat.toString()}>
              <span key={"span-beat-" + beat.toString()} className={beat === this.props.activeNote ? "activeNote" : ""}>{line[beat].join("")}</span>
              <span key={"span-beat-marker-" + beat.toString()}>{(this.props.config.showBeatMark && beat !== beats[beats.length-1]) ? this.props.config.beatMark : ""}</span>
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
        {this.props.config.showBeatNumbers ? formatLine("beat", beatChunks) : "" }
        {lineIndices.map(lineIndex=>formatLine(lineIndex.toString(), linesWithBeats[lineIndex]))}
      </React.Fragment>
    );
  }
}

export default withStyles(useStyles)(Part);