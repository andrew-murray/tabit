import React from 'react';
import FileImport from "./FileImport";
import h2 from './h2';
import './App.css';

class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleFileImport(e)
  {
    // e = { file : , content : }
    h2.parseHydrogenPromise(e.content).then(e => console.log(e));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">tabit</header>
        <FileImport
          onImport={this.handleFileImport}
          />
      </div>
    );
  }
}

export default App;
