import React from 'react';
import Pattern from "./Pattern";
import h2 from './h2';

// define mui theme, including responsiveFont
import { createMuiTheme, ThemeProvider, responsiveFontSizes } from '@material-ui/core/styles';

// drawer
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Divider from "@material-ui/core/Divider";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Toolbar from '@material-ui/core/Toolbar';

import SongLoaders from "./SongLoaders"

// notationSettings

import {FormatSettings, DefaultSettings} from "./formatSettings";
import InstrumentConfig from "./instrumentConfig";
import { createInstrumentMask } from "./instrumentation";
import notation from "./notation";

import Grid from '@material-ui/core/Grid';

import { saveAs } from 'file-saver';

import ToneController from "./ToneController";
import PlaybackControls from "./PlaybackControls";
import { withRouter } from "react-router-dom";

import hash from "object-hash";
import zlib from "zlib";
import copy from "copy-to-clipboard";

import { isMobile } from "./Mobile";

import TabitBar from "./TabitBar";

const ignoreEvent = (event) => {
  return event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift');
};

const getJsonDestinationUrl = (slug) => {
  const jsonbase_url = "https://jsonbase.com/tabit-song/" + slug;
  return jsonbase_url;
}

const getJsonStorageUrl = (slug) => {
  // jsonbase doesn't give cross-origin headers,
  // so we use cors-anywhere to add them

  // this is obviously a hack, but it enables us to use jsonbase
  // as a transitive (semi-permanent) database, on a static site!
  const cors_url = "https://cors-anywhere.herokuapp.com/";
  return cors_url + getJsonDestinationUrl(slug);
}

const modalStyles = (theme) => {
  return {
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
    }
  }
};

class App extends React.Component
{
  constructor(props) {
    super(props);
    const previousHistory = localStorage.getItem("tabit-history");
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
      showTitleOptions : this.props.match.params.song === undefined,
      songName: null,
      permanentUrl : "",
      history: previousHistory ? JSON.parse(previousHistory).sort( (a,b) =>(b.date - a.date) ) : []
    };
    this.pattern = React.createRef();
    document.app = this;
  }

  recordSongVisited()
  {
    // require { id, name, content?? }
    const exportState = this.getExportState();
    const stateToShare = this.encodeState(exportState);
    const stateHash = hash(stateToShare);

    const history = Array.from(this.state.history);
    const relevantHistory = history.filter( song => ( song.id === stateHash && song.name === exportState.songName ) );
    if( relevantHistory.length !== 0 )
    {

      // found at least one history entry that matches our constraints ... let's update the most recent one
      relevantHistory[0].date = Date.now();
    }
    else
    {
      // add history entry
      const historyEntry = {
        name: exportState.songName,
        id: stateHash,
        date: Date.now(),
        content: stateToShare
      };
      history.push(historyEntry);
    }
    // cap how many files we remember
    const restrictedHistory = history.sort( (a,b) =>(b.date - a.date)  ).slice(0, 10);
    this.setState(
      { history : restrictedHistory },
      () => {
        localStorage.setItem("tabit-history", JSON.stringify(restrictedHistory));
      }
    );
  }

  fetchSong(songID, songTitle)
  {
    fetch(getJsonStorageUrl(songID))
    .then( response => { return response.json(); } )
    .then( js => {
      const decodedState = this.decodeState(js);
      const stateHash = hash(js);
      if( stateHash !== songID )
      {
        throw new Error("Hash did not match");
      }
      this.handleJSON(decodedState, songTitle, decodedState.loadedFile);
    }).catch( (e) => {
      this.setState({showTitleOptions : true});
      alert("Song " + (songTitle ?? songID) + " could not be found." );
    } );
  }

  loadLocalSong(inputSong)
  {
    const resolveSong = (song) => {
      const decodedState = this.decodeState(song.content);
      const stateHash = hash(song.content);
      if( stateHash !== song.id )
      {
        throw new Error("Hash did not match");
      }
      this.handleJSON(decodedState, song.name, decodedState.loadedFile);
    };

    const displayError = (err) => {
      this.setState({showTitleOptions : true});
      alert("Failed to load song " + inputSong.name + ". Encountered error " + err.toString() );
    };

    this.setState(
      {showTitleOptions : false }
    );
    Promise.resolve(inputSong)
      .then(resolveSong)
      .catch( displayError );
  }

  componentDidMount()
  {
    if( this.props.match.params.song )
    {
      this.fetchSong(this.props.match.params.song);
    }
  }

  componentWillUnmount()
  {
    if( this.audio )
    {
      this.audio.teardown();
      delete this.audio;
    }
  }

  getExportState()
  {
    return {
      instruments : this.state.instruments,
      instrumentIndex : this.state.instrumentIndex,
      patterns : this.state.patterns,
      formatSettings: this.state.formatSettings,
      patternSettings : this.state.patternSettings,
      songName: this.state.songName,
      version: "1.1.0"
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

    const permanentUrl = window.origin + process.env.PUBLIC_URL + "/song/" + stateHash;
    fetch(uploadUrl, metadata).then(
      e => {
        this.setState({permanentUrl : permanentUrl, showSharingDialog: true})
      }
    ).catch(err => { alert("Couldn't upload song at this time. Sorry for any inconvenience."); });
  }

  figurePatternSettings(patterns)
  {
    return Array.from(
      patterns,
      (p) => notation.guessPerPatternSettings( p.instrumentTracks )
    );
  }

  songNameFromFile(filename)
  {
    if(filename === null || filename === undefined)
    {
      return null;
    }
    if( filename.includes(".") )
    {
      const songTitle = filename.split('.').slice(0, -1).join('.');
      return songTitle;
    }
    else
    {
      return filename;
    }
  }

  handleJSON(data, title, filename)
  {
    SongLoaders.LoadJSON(data, title, filename).then(
      (songData) => {
        this.setState(
          {
            instrumentIndex : songData.instrumentIndex,
            instrumentMask : songData.instrumentMask,
            instruments : songData.instruments,
            patterns : songData.patterns,
            selectedPattern : songData.patterns.length === 0 ? null : 0,
            loadedFile : songData.sourceFile,
            patternsOpen : true,
            patternSettings : this.figurePatternSettings(songData.patterns),
            songName : songData.title
          },
          ()=>{ this.handleSongChange(true); } // no need to record the example, it's embedded into the website anyway
        );
      }
    );
  }

  handleFileImport(e)
  {
    if( e.file.name.includes("h2song") )
    {
      h2.parseHydrogenPromise(e.content).then(h => {
        this.handleJSON(h, this.songNameFromFile(e.file.name), e.file.name);
      }).catch( (error)=>{ alert("Failed to load file " + e.file.name  + " with error " + error); } );
    }
    else
    {
      // assume it's a tabit file!
      Promise.resolve(e.content)
        .then(JSON.parse)
        .then( prevState => { this.handleJSON(prevState, this.songNameFromFile(e.file.name), e.file.name); } )
        .catch( (error)=>{ alert("Failed to load file " + e.file.name  + " with error " + error); } );
    }
  }

  handleSongChange(recordHistory)
  {
    // if mobile prioritise smooth playback
    const latencyHint = isMobile() ? "playback" : null;
    // always default tempo to 100bpm for now
    this.audio = new ToneController(
      this.state.instrumentIndex,
      this.state.patterns,
      100.0,
      (time)=>{this.onPatternTimeChange(time);},
      latencyHint
    );
    this.audio.setActivePattern( this.state.patterns[this.state.selectedPattern].name );
    if(recordHistory)
    {
      // this.recordSongVisited();
    }
  }

  loadExample()
  {
    SongLoaders.LoadExample().then(
      (songData) => {
        this.setState(
          {
            instrumentIndex : songData.instrumentIndex,
            instrumentMask : songData.instrumentMask,
            instruments : songData.instruments,
            patterns : songData.patterns,
            selectedPattern : songData.patterns.length === 0 ? null : 0,
            loadedFile : songData.sourceFile,
            patternsOpen : true,
            patternSettings : this.figurePatternSettings(songData.patterns),
            songName : songData.title
          },
          ()=>{ this.handleSongChange(false); } // no need to record the example, it's embedded into the website anyway
        );
      }
    );
  }

  selectPattern(patternIndex)
  {
    // it's important to do this before we re-render components
    this.audio.setActivePattern(
      this.state.patterns[patternIndex].name
    );

    this.setState(
      { selectedPattern: patternIndex }
    );
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
        <PlaybackControls
          onPlay={()=>{if(this.audio){this.audio.play();}}}
          onStop={()=>{if(this.audio){this.audio.stop();}}}
          onTempoChange={(tempo)=>{if(this.audio){this.audio.setTempo(tempo);}}}
        />
      </React.Fragment>
    );
  }

  onPatternTimeChange(time)
  {
    this.setState({patternTime: time})
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
    return <div></div>;
  }

  renderPatternDrawer(iOS, mobile)
  {
    const handlePatternsToggle = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( { patternsOpen : !this.state.patternsOpen } );
    };

    // SwipableDawer has undesirable behaviour,
    // (a) persistent isn't handled properly
    // (b) onOpen of swipable drawer, is only called on swipe events
    // I can't find convenient callbacks to hook into that are called "when the component exists"
    // (components are deleted when the swipable drawer is closed)
    // I think my approach would have to involve modifying the content in the swipeable drawer in
    // a somewhat complex way sadly - not yet

    return (
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
      variant={mobile ? undefined : "persistent"}
      open={this.state.patternsOpen}
      onOpen={handlePatternsToggle}
      onClose={handlePatternsToggle}
      >
        {!mobile ? <TabitBar placeholder /> : null }
        <div
          style={{overflow: "auto"}}
        >
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

    const handleSettingsToggle = (e) => {
      if( ignoreEvent(e) ){ return; }
      this.setState( {settingsOpen : !this.state.settingsOpen} );
    };

    const patternToRender = this.state.patterns[this.state.selectedPattern];

    const patternDetails = {
      name : patternToRender.name,
      resolution : patternToRender.resolution,
      "length" : this.getTrackLength(patternToRender)
    };

    const { theme } = this.props

    return (
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
        className={classes.drawer}
        variant={ mobile ? undefined : "persistent" }
        anchor="right"
        open={this.state.settingsOpen}
        onOpen={handleSettingsToggle}
        onClose={handleSettingsToggle}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        {!mobile ? <TabitBar placeholder /> : null }
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

      const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const mobile = isMobile();

      const instrumentConfigColumns = mobile ? 12 : 8;

      const sendVolumeEvent = (event) =>
      {
        if("volume" in event)
        {
          const instrumentID = this.state.instrumentIndex[ event.instrument ].id;
          this.audio.setVolumeForInstrument( instrumentID, event.volume );
        }
        else if("muted" in event)
        {
          const instrumentID = this.state.instrumentIndex[ event.instrument ].id;
          this.audio.setMutedForInstrument( instrumentID, event.muted );
        }
      };

      return (
        <React.Fragment>
          <Toolbar variant="dense"/>
          {this.renderSharingDialog()}
          <TabitBar
            title={this.state.songName}
            settingsToggle={(e)=>{this.setState({settingsOpen: !this.state.settingsOpen})}}
            patternsToggle={(e)=>{this.setState({patternsOpen: !this.state.patternsOpen})}}
          />
          {patternContent}
          <Grid container>
          {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
          <Grid item xs={instrumentConfigColumns}>
          <InstrumentConfig
              instruments={this.state.instruments}
              instrumentIndex={this.state.instrumentIndex}
              instrumentMask={this.state.instrumentMask}
              onChange={changeInstrumentsCallback}
              onVolumeEvent={sendVolumeEvent}
            />
          </Grid>
          {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
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
        {mainContent}
      </div>
    );
  }
}

export default withStyles(modalStyles)(withRouter(App));
