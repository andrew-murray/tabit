import React from 'react';
import clsx from 'clsx';
import FileImport from "./FileImport";
import Pattern from "./Pattern";
import h2 from './h2';
import './App.css';

import { Alert } from '@material-ui/lab';

// define mui theme, including responsiveFont
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

// drawer
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
// notationSettings

import {FormatSettings, DefaultSettings} from "./formatSettings";
import {createInstrumentMask, InstrumentConfig} from "./instrumentConfig";
import { activeInstrumentation, figureInstruments, DEFAULT_INSTRUMENT_SYMBOLS } from "./instrumentation";

// mui theme config
let theme = createMuiTheme( { 
  palette: { 
    type: 'dark',
    primary: { main: '#36d9be' },
    secondary: { main: '#f50057' }
   } 
} );


class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      instruments : null,
      instrumentIndex : null,
      instrumentMask : null,
      patterns : null,
      selectedPattern : null,
      loadedFile : null,
      settingsOpen : false,
      formatSettings : Object.assign({}, DefaultSettings)
    };
  }

  handleFileImport(e)
  {
    // e = { file : , content : }
    h2.parseHydrogenPromise(e.content).then(h => {
      const assessedInstruments = figureInstruments(h.instruments, DEFAULT_INSTRUMENT_SYMBOLS, h.patterns);
      const instrumentIndex = activeInstrumentation(h.instruments, h.patterns);
      this.setState({
        instrumentIndex : instrumentIndex,
        instrumentMask : createInstrumentMask(instrumentIndex, assessedInstruments),
        instruments : assessedInstruments,
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
  renderPattern(pattern, settings)
  {
    const changeInstrumentsCallback = (instruments) => {
      this.setState( {
        instruments : instruments,
        instrumentMask : createInstrumentMask(this.state.instrumentIndex, instruments)
      } );
    }
    return (
      <React.Fragment>
        <Pattern 
          instruments={this.state.instruments} 
          tracks={pattern.instrumentTracks}
          config={this.state.formatSettings}
        />
        <InstrumentConfig
          instruments={this.state.instruments}
          instrumentIndex={this.state.instrumentIndex}
          instrumentMask={this.state.instrumentMask}
          onChange={changeInstrumentsCallback}
        />
      </React.Fragment>
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
        <div>
          <h2>tabit</h2>
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
      // default title 
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
       
      const handleDrawerOpen = () => {
        this.setState( {settingsOpen : true} );
      };

      const handleDrawerClose = () => {
        this.setState( {settingsOpen : false} );
      };

      const settingsChangeCallback = (config) => {
        this.setState( { formatSettings: config } );
      };

      const classes = this.props;

      // ugh 95%, seems flex doesn't solve everything
      return (
        <React.Fragment>
          <div style={{display:"flex", width: "95%"}}> 
            <div className="content-title" style={{flexGrow:1}}>
            </div>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerOpen}
              className={clsx(this.state.settingsOpen && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
          </div>
          {patternContent}

      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={this.state.settingsOpen}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
              <ChevronRightIcon />
          </IconButton>
        </div>
        <FormatSettings onChange={settingsChangeCallback} settings={this.state.formatSettings}/>  
        </Drawer>
        </React.Fragment>
      );
    }
  }

  render() {
    const classes = this.props;
    const patternsReady = this.state.patterns != null;
    const mainContent = this.renderMainContent();
    return (
      <div className="App">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Drawer
            className={classes.drawer}
            variant="persistent"
            open={patternsReady}
          >
            <div className={classes.drawerContainer}>
              <List>
                {(this.state.patterns ?? []).map( (pattern, index) => (
                  <ListItem button key={"drawer-pattern" + index.toString()} onClick={() => this.selectPattern(index)}>
                      <ListItemText primary={pattern.name} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Drawer>
          {mainContent}
        </ThemeProvider>
      </div>
    );
  }
}

export default App;
