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
      color : theme.palette.secondary.main
    }
  },
});

class Pattern extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const { classes } = this.props;
    const instrumentIndices = [...this.props.instruments.keys()];
    return (
      <div className={classes.root} >
        { instrumentIndices.map( 
            (instrumentIndex) => ( <PartWithTitle 
              key={"part-" + instrumentIndex.toString()}
              instrumentName={this.props.instruments[instrumentIndex][0]}
              instrument={this.props.instruments[instrumentIndex][1]}
              tracks={this.props.tracks} // todo: filter relevant for good react-ness
              formatConfig={this.props.config}
            /> )
          )
        }
      </div>
    );
  }
}

export default withStyles(useStyles)(Pattern);