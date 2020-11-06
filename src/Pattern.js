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
  constructor(props) {
    super(props);
    this.state = {
      patternTime : undefined
    };
  }

  onPatternTimeChange(patternTime)
  {
    if( patternTime !== null && patternTime !== undefined )
    {
      this.setState({patternTime : patternTime});
    }
    else
    {
      this.setState({patternTime : undefined });
    }
  }

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
              activeNote={this.state.patternTime !== undefined ? Math.floor(this.state.patternTime / beatResolution) : undefined}
            /> )
          )
        }
        </div>
      </div>
    );
  }
}

export default withStyles(useStyles)(Pattern);