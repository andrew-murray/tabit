import React from 'react';
import PartWithTitle from "./PartWithTitle";
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    "margin-bottom": theme.spacing(2),
    fontFamily: "Roboto Mono",
    textAlign: "left",
    whiteSpace:"pre",
    "& .activeNote": {
      color : theme.palette.primary.main
    },
    "margin": "auto"
  },
});

class Pattern extends React.Component
{
  render() {
    const { classes } = this.props;
    const instrumentIndices = [...this.props.instruments.keys()];
    const beatResolution = this.props.config.beatResolution;
    return (
      <div className={classes.root} >
        <div style={{"margin": "auto"}}>
        { instrumentIndices.map(
            (instrumentIndex) => ( <PartWithTitle
              key={"part-" + instrumentIndex.toString()}
              instrumentName={this.props.instruments[instrumentIndex][0]}
              instrument={this.props.instruments[instrumentIndex][1]}
              tracks={this.props.tracks}
              config={this.props.config}
              activeNote={this.props.patternTime !== undefined ? Math.floor(this.props.patternTime / beatResolution) : undefined}
            /> )
          )
        }
        </div>
      </div>
    );
  }
}

export default withStyles(useStyles)(Pattern);
