import React from 'react';
import notation from "./notation"

class Pattern extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  static hardCodedInstruments = [
    ["Bottom Bass", {"0" : "O", "18" : "X"}],
    ["Mid Bass", {"1" : "X", "17" : "O"}], 
    ["Shaker", {"16" : "x", "21" : "X"}],
    ["Snare", {"2" : "X", "13" : "-"}], 
    ["Djembe", {"10" : "S", "11" : "t", "12" : "O"}]
  ];

  // remove me and relpace with me with something way better
  // this is taken from the notation formatAsPage code
  formatText()
  {
    let configOverride = {};
    let page = [];
    for( const [instrumentName, instrument] of Pattern.hardCodedInstruments )
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
      <div className="Pattern">
        { this.formatText().map((x,index) => <p>{x}</p>) }
      </div>
    );
  }
}

export default Pattern;