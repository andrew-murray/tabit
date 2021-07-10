import React from 'react';
import Pattern from "./Pattern";
import PlaybackControls from "./PlaybackControls";
import notation from "./notation";
import InstrumentConfig from "./instrumentConfig";
import { createInstrumentMask } from "./instrumentation";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';
import Snackbar from '@material-ui/core/Snackbar';
import TabitBar from "./TabitBar";
import PatternDrawer from "./PatternDrawer"
import ToneController from "./ToneController"
import SettingsDrawer from "./SettingsDrawer"
import { isMobile } from "./Mobile";
import SharingDialog from "./SharingDialog";
import PatternCreateDialog from "./PatternCreateDialog";
import Toolbar from '@material-ui/core/Toolbar';
// todo: pass the needed .put function via a prop?
import * as SongStorage from "./SongStorage";
import PatternEditor from "./PatternEditor";
import memoizeOne from 'memoize-one';

const makeResolvedSettings = memoizeOne( (globalSettings, patternSettings) => {
  let resolvedSettings = Object.assign({}, globalSettings);
  if(patternSettings)
  {
    resolvedSettings = Object.assign(resolvedSettings, patternSettings);
  }
  return resolvedSettings;
});



class EditorView extends React.Component
{

  state = {
    selectedPattern: 0,
    formatSettings: this.props.songData.formatSettings,
    songData: {instruments: this.props.songData.instruments,
        instrumentIndex: this.props.songData.instrumentIndex,
        instrumentMask: this.props.songData.instrumentMask,
        patterns: this.props.songData.patterns,
        title: this.props.songData.title
    },
    sharingDialogOpen: false,
    patternEditorOpen: false,
    patternEditorContent: null,
    patternEditorErrors: [],
    patternTime: null,
    errorAlert: null
  }

  componentDidMount()
  {
    this.createController();
    // save our work when we navigate away via tab-close
    window.addEventListener('beforeunload', this.onSave);
  }

  createController()
  {
    /*
    if(this.audio){ this.audio.teardown(); }
    const latencyHint = isMobile() ? "playback" : null;
    const animateCallback = (time)=>{
      const nullCheck = (this.state.patternTime === null) !== (time === null);
      const currentBeatResolution = this.state.patternSettings[this.state.selectedPattern].beatResolution;
      const currentBeat = Math.floor(this.state.patternTime / currentBeatResolution);
      const nextBeat =  Math.floor(time / currentBeatResolution);
      if( nullCheck || currentBeat !== nextBeat )
      {
        this.setState( {patternTime: time} )
      }
    };
    this.audio = new ToneController(
      this.state.songData.instrumentIndex,
      this.state.songData.patterns,
      100.0,
      animateCallback,
      latencyHint,
      this.setError
    );
    this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
    */
  }


    render()
    {
      window.songData = this.state.songData;
      const mobile = isMobile();
      // todo: make this Toolbar unnecessary, it ensures pattern renders in the right place right now

      return (
        <div className="App">
          <Toolbar variant="dense"/>
          <TabitBar
            title={this.state.songData.title}
            settingsToggle={this.handleSettingsToggle}
            patternsToggle={this.handlePatternsToggle}
            onDownload={this.onDownload}
            onShare={this.onShare}
            locked={this.state.locked}
            onLockUnlock={this.onToggleLocked}
          />
          {this.state.errorAlert &&
          <Snackbar severity="error" open={true} autoHideDuration={5000} onClose={() => {this.setState({errorAlert: null})}}>
            <Alert severity="error"  onClose={() => {this.setState({errorAlert: null})}}>
              <AlertTitle>Error</AlertTitle>
              <Box>
              {this.state.errorAlert.split("\n").map(line=><Box>{line}</Box>)}
              </Box>
            </Alert>
          </Snackbar>
          }
          <div style={{display: "flex", flexGrow : 1}} />
            <PatternEditor
              content=""
              errors={this.state.patternEditorErrors}
              onChange={this.onPatternEditorContentChange}
            />
          <div style={{display: "flex", flexGrow : 1}} />
          <PlaybackControls
            onPlay={this.onPlay}
            onStop={this.onStop}
            onTempoChange={this.onSetTempo}
            disabled={false}
          />
          <SharingDialog
            open={this.state.sharingDialogOpen}
            onClose={this.closeSharingDialog}
            url={this.state.permanentUrl}
            />
        </div>
      );
    }
};

export default EditorView;
