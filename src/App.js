import React from 'react';
import FileImport from "./FileImport";
import Pattern from "./Pattern";
import h2 from './h2';
import './App.css';

class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      instruments : null,
      patterns : null
    };
  }

  handleFileImport(e)
  {
    // e = { file : , content : }
    h2.parseHydrogenPromise(e.content).then(h => {
      this.setState({
        instruments : h.instruments,
        patterns : h.patterns
      });
    });
  }

  render() {
    if(this.state.patterns == null)
    {
      return (
        <div className="App">
          <header className="App-header">tabit</header>
          <FileImport
            onImport={this.handleFileImport.bind(this)}
            />
        </div>
      );      
    }
    else
    {
      let patternList = [];
      console.log(this.state.instruments);
      for( const pattern of this.state.patterns ) {
        let parts = [];
        for( const [id, part] of Object.entries(pattern.instrumentTracks))
        {
          // todo: === expected but doesnt work, unclear how these types dont match
          const foundElement = this.state.instruments.find( element => (element.id == id) );
          if( foundElement == null )
          {
            continue;
          }
          parts.push( [foundElement.name, part] );
        }
        console.log(parts);

        patternList.push(
            <div>
              <h1>{pattern.name}</h1>
              <Pattern 
                instruments={this.state.instruments} 
                parts={parts}
                />
            </div>
        );
      }

      return (
        <div className="App">
          {patternList}
        </div>
      )
    }
  }
}

export default App;
