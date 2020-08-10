import React from 'react';
import notation from "./notation"
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

// const classes = useStyles();

class Pattern extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  // remove me and relpace with me with something way better
  // this is taken from the notation formatAsPage code
  formatText(instruments)
  {
    let configOverride = this.props.config;
    let page = [];
    for( const [instrumentName, instrument] of instruments )
    {
      const notationString = notation.fromInstrumentAndTrack(
        instrument,
        this.props.tracks,
        configOverride
      );
      page.push(instrumentName);
      for( const x of notationString.split("\n"))
      {
        page.push(x);
      }
    }
    return page;
  }  

  render() {
    const { classes } = this.props;
    // todo: I think I need to turn the creation of the pattern text, into a react setting,
    // so that I can add my light show
    return (
      <div className={classes.root} >
        { this.formatText(this.props.instruments).map((x,index) => <p key={index.toString()} dangerouslySetInnerHTML={{"__html" : x}} />) }
      </div>
    );
  }
}

export default withStyles(useStyles)(Pattern);