import React from 'react';
import notation from "./notation"

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
    return (
      <div className="Pattern" style={{"fontFamily": "Roboto Mono", "textAlign": "left", whiteSpace:"pre"}}>
        { this.formatText(this.props.instruments).map((x,index) => <p key={index.toString()}>{x}</p>) }
      </div>
    );
  }
}

export default Pattern;