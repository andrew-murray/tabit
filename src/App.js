import React from 'react';
import FileImport from "./FileImport";
import Pattern from "./Pattern";
import h2 from './h2';
import './App.css';

import { Alert } from '@material-ui/lab';

// define mui theme, including responsiveFont
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

// drawer
// import { makeStyles } from '@material-ui/core/styles'; // function-style-api
// import { withStyles } from '@material-ui/styles'; // class-style-api
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
// import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

// mui theme config
let theme = createMuiTheme( { 
  palette: { 
    type: 'dark',
    primary: { main: '#3f51b5' },
    secondary: { main: '#f50057' }
   } 
} );


class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      instruments : null,
      patterns : null,
      selectedPattern : null,
      loadedFile : null
    };
  }

  handleFileImport(e)
  {
    // e = { file : , content : }
    h2.parseHydrogenPromise(e.content).then(h => {
      this.setState({
        instruments : h.instruments,
        patterns : h.patterns,
        selectedPattern : h.patterns.length === 0 ? null : 0,
        loadedFile : e.file.name
      });
    });
  }

  selectPattern(patternIndex)
  {
    this.setState( { selectedPattern: patternIndex } );
  }

  // todo: this is a separate component!
  renderPattern(pattern)
  {
    return ( 
      <div>
        <h1>{pattern.name}</h1>
        <Pattern 
          instruments={this.state.instruments} 
          tracks ={pattern.instrumentTracks}
          />
      </div>
    );
  }

  // todo: this will go away eventually, once I choose how to load a file
  // (though it should obviously be another component anyway)
  renderMainContent()
  {
    if(this.state.patterns == null || this.state.patterns.length === 0)
    {
      const showAlert = this.state.patterns != null && this.state.patterns.length === 0;
      const optionalAlert = showAlert ? ( <Alert severity="error">{this.state.loadedFile} contained no patterns! Try another.</Alert> )
                                      : "";
      return (
        <div className="App">
          <FileImport
            onImport={this.handleFileImport.bind(this)}
            />
            {optionalAlert}
        </div>
      );      
    }
    else
    {
      let patternContent = null;
      if( this.state.selectedPattern == null )
      {
        patternContent = [];
        for( const pattern of this.state.patterns ) {
          patternContent.push( this.renderPattern(pattern) );
        }
      }
      else
      {
        const patternToRender = this.state.patterns[this.state.selectedPattern];
        patternContent = this.renderPattern(patternToRender);
      }

      return (
        <div className="App">
          {patternContent}
        </div>
      );
    }
  }

  render() {
    const classes = this.props;
    const patternsReady = this.state.patterns != null;
    let mainContent = this.renderMainContent();
    return (
      <div className={classes.root}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="fixed" className={classes.appBar}>
            <Toolbar>
              <Typography variant="h6" noWrap>
                tabit
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="persistent"
            className={classes.drawer}
            open={patternsReady}
            classes={{
              // paper: classes.drawerPaper,
            }}
          >
            <Toolbar />
            <div className={classes.drawerContainer}>
              <Typography noWrap={true}>
              <List>
                {(this.state.patterns ?? []).map( (pattern, index) => (
                  <ListItem button key={"drawer-pattern" + index.toString()} onClick={() => this.selectPattern(index)}>
                    <ListItemText primary={pattern.name} />
                  </ListItem>
                ))}
              </List>
              </Typography>
            </div>
          </Drawer>
          <main className={classes.content}>
            <Toolbar />
            {mainContent}
          </main>
        </ThemeProvider>
      </div>
    );
  }
}

export default App;
