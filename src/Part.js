import React from 'react';
import notation from "./notation"
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    whiteSpace:"pre",
    "& .activeNote": {
      color : theme.palette.secondary.main
    }
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
    return (
      <p
        dangerouslySetInnerHTML={{"__html" : notation.fromInstrumentAndTrack(
          this.props.instrument,
          this.props.tracks,
          true,
          this.props.config
          )
        }}
      />
    );
  }
}

export default withStyles(useStyles)(Part);