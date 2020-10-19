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
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Divider from "@material-ui/core/Divider";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';

// notationSettings

import {FormatSettings, DefaultSettings} from "./formatSettings";
import {createInstrumentMask, InstrumentConfig} from "./instrumentConfig";
import { activeInstrumentation, figureInstruments, DEFAULT_INSTRUMENT_SYMBOLS } from "./instrumentation";
import notation from "./notation";

import Grid from '@material-ui/core/Grid';

// load static data
import kuva from "./kuva.json";
import track from "./track";

import { saveAs } from 'file-saver';

import ToneBoard from "./ToneBoard";
import { withRouter } from "react-router-dom";

import hash from "object-hash";
import zlib from "zlib";
import copy from "copy-to-clipboard";

// mui theme config
let theme = createMuiTheme( { 
  palette: { 
    type: 'dark',
    primary: { main: '#36d9be' },
    secondary: { main: '#f50057' }
   } 
} );

const ignoreEvent = (event) => {
  return event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift');
};

const getJsonDestinationUrl = (slug) => {
  const jsonbase_url = "http://jsonbase.com/tabit-song/" + slug;
  return jsonbase_url;
}

const getJsonStorageUrl = (slug) => {
  // jsonbase doesn't give cross-origin headers, 
  // so we use cors-anywhere to add them

  // this is obviously a hack, but it enables us to use jsonbase
  // as a transitive (semi-permanent) database, on a static site!
  const cors_url = "http://cors-anywhere.herokuapp.com/";
  return cors_url + getJsonDestinationUrl(slug);
}

const modalStyles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
};

class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      // data
      instruments : null,
      instrumentIndex : null,
      instrumentMask : null,
      patterns : null,
      formatSettings : Object.assign({}, DefaultSettings),
      patternSettings : [],
      // ui state
      loadedFile : null,
      selectedPattern : null,
      settingsOpen : false,
      patternsOpen : false,
      progress : null,
      showSharingDialog : false,
      permanentUrl : ""
    };
    this.pattern = React.createRef();
  }

  componentDidMount()
  {
    if( this.props.match.params.song )
    {
      fetch(getJsonStorageUrl(this.props.match.params.song))
      .then( response => { return response.json(); } )
      .then( js => {
        const decodedState = this.decodeState(js);
        const stateHash = hash(js);
        if( stateHash !== this.props.match.params.song )
        {
          throw new Error("Hash did not match");
        }
        this.handleJson(null, decodedState);
      }).catch( (e) => { alert("Song " + this.props.match.params.song + " could not be found." ); } );
    }
  }

  getExportState()
  {
    return {
      instruments : this.state.instruments,
      instrumentIndex : this.state.instrumentIndex,
      patterns : this.state.patterns,
      formatSettings: this.state.formatSettings,
      patternSettings : this.state.patternSettings
    }
  }

  save()
  {
    let destFilename = "download.tabit";
    if(this.state.loadedFile)
    {
      const fileParts = this.state.loadedFile.split(".");
      if( fileParts.length === 1 )
      {
        destFilename = fileParts[0] + ".tabit";
      }
      else
      {
        destFilename = fileParts.slice(0, fileParts.length - 1).join(".") + ".tabit";
      }
    }

    const js = JSON.stringify(this.getExportState(), null, 4);
    const blob = new Blob([js], {type: "application/json"});
    saveAs(blob, destFilename);
  }

  encodeState(state)
  {
    // json
    const js = JSON.stringify(this.getExportState());
    // compress
    const compressedState = zlib.deflateSync(js).toString("base64");
    return { state : compressedState };
  }

  decodeState(state)
  {
    const binaryBuffer = new Buffer(state.state, "base64");
    const decompressedString = zlib.inflateSync(binaryBuffer);
    return JSON.parse(decompressedString);
  }

  share()
  {
    const stateToShare = this.encodeState(this.getExportState());
    const stateHash = hash(stateToShare);
    const uploadUrl = getJsonStorageUrl(stateHash);

    const metadata = {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateToShare)
    };

    const permanentUrl = process.env.PUBLIC_URL + "/song/" + stateHash;
    fetch(uploadUrl, metadata).then(
      e => {
        this.setState({permanentUrl : permanentUrl, showSharingDialog: true})
      }
    ).catch(err => { console.log("err"); console.log(err); });
  }

  figurePatternSettings(patterns)
  {
    return Array.from(
      patterns,
      (p) => notation.guessPerPatternSettings( p.instrumentTracks )
    );
  }


  handleJson(title, prevState)
  {
    const createTracks = (patternData) =>
    {
      // the instruments currently work as simple objects
      // we need to create tracks!
      let patterns = [];
      for( let pattern of patternData )
      {
        let replacedTracks = {};
        // todo: find a more compact way of doing this
        for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
        {
          replacedTracks[id] = new track( trackData.rep, trackData.resolution );
        }
        let patternWithTracks = Object.assign({}, pattern);
        patternWithTracks.instrumentTracks = replacedTracks;
        patterns.push(patternWithTracks);
      }
      return patterns;
    }
    this.setState( {
      instrumentIndex : prevState.instrumentIndex,
      instrumentMask : createInstrumentMask(prevState.instrumentIndex, prevState.instruments),
      instruments : prevState.instruments,
      patterns : createTracks(prevState.patterns),
      formatSettings : prevState.formatSettings,
      patternSettings : prevState.patternSettings,
      // general app state
      loadedFile : title ?? prevState.loadedFile,
      selectedPattern : prevState.patterns.length === 0 ? null : 0,
      patternsOpen : prevState.patterns.length !== 0
    } );
  }

  handleFileImport(e)
  {
    if( e.file.name.includes("h2song") )
    {
      // e = { file : , content : }
      h2.parseHydrogenPromise(e.content).then(h => {
        const assessedInstruments = figureInstruments(h.instruments, DEFAULT_INSTRUMENT_SYMBOLS, h.patterns);
        const instrumentIndex = activeInstrumentation(h.instruments, h.patterns);
        this.setState({
          // data
          instrumentIndex : instrumentIndex,
          instrumentMask : createInstrumentMask(instrumentIndex, assessedInstruments),
          instruments : assessedInstruments,
          patterns : h.patterns,
          patternSettings : this.figurePatternSettings(h.patterns),
          // general app state
          loadedFile : e.file.name,
          patternsOpen : true,
          selectedPattern : h.patterns.length === 0 ? null : 0,
        });
      }).catch( (error)=>{ alert("Failed to load file " + e.file.name  + " with error " + error); } );
    }
    else
    {

      // assume it's a tabit file!
      Promise.resolve(e.content)
        .then(JSON.parse)
        .then( prevState => { this.handleJson(e.file.name,prevState); } )
        .catch( (error)=>{ alert("Failed to load file " + e.file.name  + " with error " + error); } );
    }
  }

  selectPattern(patternIndex)
  {
    this.setState( { selectedPattern: patternIndex } );
  }

  // todo: this is a separate component!
  renderPattern(pattern, resolvedSettings)
  {
    return (
      <React.Fragment>
        <Pattern 
          instruments={this.state.instruments} 
          tracks={pattern.instrumentTracks}
          config={resolvedSettings}
          active={this.state.progress}
          ref={this.pattern}
        />
        <ToneBoard 
          instruments={this.state.instruments} 
          instrumentIndex={this.state.instrumentIndex} 
          selectedPattern={pattern}
          patterns={this.state.patterns}
          onPatternTimeChange = {(time)=>{this.onPatternTimeChange(time);}}
        />
      </React.Fragment>
    );
  }

  onPatternTimeChange(time)
  {
    this.pattern.current.onPatternTimeChange(time);
  }

  loadExample()
  {
    const createObjects = (state) => 
    {
      // the instruments currently work as simple objects
      // we need to create tracks!
      for( let pattern of state.patterns )
      {
        let replacedTracks = {};
        // todo: find a more compact way of doing this
        for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
        {
          replacedTracks[id] = new track( trackData.rep, trackData.resolution );
        }
        pattern.instrumentTracks = replacedTracks;
      }
      return state;
    }
    const k = createObjects(kuva);
    const assessedInstruments = figureInstruments(k.instruments, DEFAULT_INSTRUMENT_SYMBOLS, k.patterns);
    const instrumentIndex = activeInstrumentation(k.instruments, k.patterns);
    this.setState({
      instrumentIndex : instrumentIndex,
      instrumentMask : createInstrumentMask(instrumentIndex, assessedInstruments),
      instruments : assessedInstruments,
      patterns : k.patterns,
      selectedPattern : k.patterns.length === 0 ? null : 0,
      loadedFile : "kuva.example",
      patternsOpen : true,
      patternSettings : this.figurePatternSettings(k.patterns)
    });
  }

  checkMobile()
  {
    // the simple version from
    // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
    const userAgent = (navigator.userAgent||navigator.vendor||window.opera);
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return userAgent.match(toMatchItem);
    });
  }


  getTrackLength(pattern)
  {
    let trackLength = 48;
    for(const [,t] of Object.entries(pattern.instrumentTracks))
    {
        trackLength = Math.max( trackLength, t.length() );
    }
    return trackLength;
  }

  getResolution(pattern)
  {
    let resolution = 48;
    for(const [,t] of Object.entries(pattern.instrumentTracks))
    {
        resolution = Math.min( resolution, t.resolution );
    }
    return resolution;
  }

  renderTitlePage()
  {
    const showAlert = this.state.patterns != null && this.state.patterns.length === 0;
    const optionalAlert = showAlert ? ( <Alert severity="error">{this.state.loadedFile} contained no patterns! Try another.</Alert> )
                                    : "";
    return (
      <React.Fragment>
      <div>
        <h2>tabit</h2>
        <p>I read .h2songs and write tab</p>
        <Button variant="contained" onClick={this.loadExample.bind(this)} style={{margin: "1em"}}>Load example</Button>
        <FileImport
          style={{margin: "1em"}}
          variant="contained"
          onImport={this.handleFileImport.bind(this)}
          accept=".tabit,.h2song"
          />
          {optionalAlert}
      </div>
      <div style={{ position:"absolute", bottom:0 }} >
        <p>tabit relies on publicly available sound libraries listed at <a href="https://github.com/andrew-murray/tabit">https://github.com/andrew-murray/tabit</a></p>
      </div>
      </React.Fragment>
    );
  }

  renderPatternDrawer(iOS, mobile)
  {
    const classes = this.props;
    const handlePatternsClose = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( { patternsOpen : false } );
    };
    const handlePatternsOpen = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( { patternsOpen : true } );
    };

    return (
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
      className={classes.drawer}
      variant={ mobile ? undefined : "persistent" }
      open={this.state.patternsOpen}
      onOpen={handlePatternsOpen}
      onClose={handlePatternsClose}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handlePatternsClose}>
              <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <div className={classes.drawerContainer}>
          <List>
            {(this.state.patterns ?? []).map( (pattern, index) => (
              <ListItem button key={"drawer-pattern" + index.toString()} onClick={() => this.selectPattern(index)}>
                  <ListItemText primary={pattern.name} />
              </ListItem>
            ))}
          </List>
        </div>
      </SwipeableDrawer>
    );
  }



  renderSettingsDrawer(iOS, mobile, patternConfig)
  {
    const classes = this.props;
    const settingsChangeCallback = (config) => {
      let existingPatternSettings = Array.from( this.state.patternSettings );
      let existingGlobalSettings = Object.assign( {}, this.state.formatSettings );
      for( let [k,v] of Object.entries(config) )
      {
        if( k in existingPatternSettings[this.state.selectedPattern] )
        {
          existingPatternSettings[this.state.selectedPattern][k] = v;
        }
        else
        {
          existingGlobalSettings[k] = v;
        }
      }
      this.setState( { formatSettings: existingGlobalSettings, patternSettings : existingPatternSettings } );
    };

    const handleDrawerOpen = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( {settingsOpen : true} );
    };

    const handleDrawerClose = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( {settingsOpen : false} );
    };

    const patternToRender = this.state.patterns[this.state.selectedPattern];

    const patternDetails = {
      name : patternToRender.name,
      resolution : patternToRender.resolution,
      "length" : this.getTrackLength(patternToRender)
    };

    return (
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
        className={classes.drawer}
        variant={ mobile ? undefined : "persistent" }
        anchor="right"
        open={this.state.settingsOpen}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
              <ChevronRightIcon />
          </IconButton>
        </div>
        <Divider />
        <FormatSettings
          onChange={settingsChangeCallback}
          settings={patternConfig}
          pattern={patternDetails}
          />
        <Button
          style={{backgroundColor : "white", color : theme.palette.background.default}}
          onClick={(e) => { this.save(); } }
        >Download</Button>
        <Divider />
        <Button
          style={{backgroundColor : "white", color : theme.palette.background.default}}
          onClick={(e) => { this.share(); } }
        >Share</Button>
      </SwipeableDrawer>
    );
  }

  renderSharingDialog()
  {
    return (
      <Dialog
        open={this.state.showSharingDialog}
        onClose={(e)=>{this.setState({showSharingDialog: false});}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          Your song is available at
          </DialogContentText>
          <DialogContentText>
          {this.state.permanentUrl}
          <IconButton onClick={(e)=>{ copy(this.state.permanentUrl); }}>
            <FileCopyIcon />
          </IconButton>
          </DialogContentText>
          <DialogActions>
            <Button onClick={(e)=>{this.setState({showSharingDialog: false})}}>
              Close
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    );
  }

  renderMainContent()
  {
    if(this.state.patterns == null || this.state.patterns.length === 0)
    {
      return this.renderTitlePage();
    }
    else
    {
      const patternToRender = this.state.patterns[this.state.selectedPattern];
      const patternConfig = Object.assign(
        Object.assign({}, this.state.formatSettings), // global settings
        this.state.patternSettings[this.state.selectedPattern] // then apply per-pattern settings
      );
      const patternContent = this.renderPattern(patternToRender, patternConfig);
       

      const changeInstrumentsCallback = (instruments) => {
        this.setState( {
          instruments : instruments,
          instrumentMask : createInstrumentMask(this.state.instrumentIndex, instruments)
        } );
      }

      const classes = this.props;
      const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const mobile = this.checkMobile();

      const instrumentConfigColumns = mobile ? 12 : 8;

      return (
        <React.Fragment>
          {this.renderSharingDialog()}
          <div style={{display:"flex", width: "95%"}}> 
            <IconButton
              color="inherit"
              aria-label="open pattern list"
              edge="start"
              onClick={(e)=>{ this.setState( {patternsOpen: true } )}}
              className={clsx({
                [classes.hide] : !this.state.patternsOpen
              })}
            >
              <ChevronRightIcon />
            </IconButton>
            <div className="content-title" style={{flexGrow:1}}>
            </div>
            <IconButton
              color="inherit"
              aria-label="open settings"
              edge="end"
              onClick={(e)=>{ this.setState( {settingsOpen: true } )}}
              className={clsx(this.state.settingsOpen && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
          </div>
          {patternContent}
          <Grid container>
          <Grid item xs={(12 - instrumentConfigColumns ) / 2} />
          <Grid item xs={instrumentConfigColumns}>
            <InstrumentConfig
              instruments={this.state.instruments}
              instrumentIndex={this.state.instrumentIndex}
              instrumentMask={this.state.instrumentMask}
              onChange={changeInstrumentsCallback}
            />
          </Grid>
          <Grid item xs={(12 - instrumentConfigColumns ) / 2} />
          </Grid>
          {this.renderPatternDrawer(iOS,mobile)}
          {this.renderSettingsDrawer(iOS,mobile, patternConfig)}
        </React.Fragment>
      );
    }
  }

  render() {
    const mainContent = this.renderMainContent();
    return (
      <div className="App">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {mainContent}
        </ThemeProvider>
      </div>
    );
  }
}

export default withStyles(modalStyles)(withRouter(App));
