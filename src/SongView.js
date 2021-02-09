import React from 'react';
import Pattern from "./Pattern";
import PlaybackControls from "./PlaybackControls";
import {DefaultSettings} from "./formatSettings";
import notation from "./notation";
import InstrumentConfig from "./instrumentConfig";
import { createInstrumentMask } from "./instrumentation";
import Grid from '@material-ui/core/Grid';
import TabitBar from "./TabitBar";
import PatternDrawer from "./PatternDrawer"
import ToneController from "./ToneController"
import SettingsDrawer from "./SettingsDrawer"
import { isMobile } from "./Mobile";
import SharingDialog from "./SharingDialog";
import Toolbar from '@material-ui/core/Toolbar';
// todo: pass the needed .put function via a prop?
import * as SongStorage from "./SongStorage";
import memoizeOne from 'memoize-one';

const figurePatternSettings = (patterns)=>{
  return Array.from(
    patterns,
    (p) => notation.guessPerPatternSettings( p.instrumentTracks )
  );
};

const makeResolvedSettings = memoizeOne( (globalSettings, patternSettings) => {
  let resolvedSettings = Object.assign({}, globalSettings);
  if(patternSettings)
  {
    resolvedSettings = Object.assign(resolvedSettings, patternSettings);
  }
  return resolvedSettings;
});

class SongView extends React.Component
{
  state = {
    selectedPattern: 0,
    patternSettings: this.props.songData ? figurePatternSettings(this.props.songData.patterns) : null,
    formatSettings: Object.assign({}, DefaultSettings),
    songData: Object.assign({},this.props.songData),
    settingsOpen: false,
    patternsOpen: true,
    sharingDialogOpen: false,
    patternTime: null
  }

  componentDidMount()
  {
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
    // always default tempo to 100bpm for now
    this.audio = new ToneController(
      this.state.songData.instrumentIndex,
      this.state.songData.patterns,
      100.0,
      animateCallback,
      latencyHint
    );
    this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
    // save our work when we navigate away via tab-close
    window.addEventListener('beforeunload', this.onSave);
  }

  componentWillUnmount()
  {
    // save our work, as we may be about to navigate away somewhere else in tabit
    this.onSave();
    window.removeEventListener('beforeunload', this.onSave);
    if( this.audio )
    {
      this.audio.teardown();
      delete this.audio;
    }
  }

  getExportState()
  {
    return {
      instruments : this.state.songData.instruments,
      instrumentIndex : this.state.songData.instrumentIndex,
      patterns : this.state.songData.patterns,
      songName: this.state.songData.title,
      formatSettings: this.state.formatSettings,
      patternSettings : this.state.patternSettings,
      version: "1.1.0"
    };
  }

  // note these functions could cleanly be locally defined
  // but react gives better performance by not doing this, sadly
  changeInstruments = (instruments) =>
  {
    let songData = Object.assign({}, this.state.songData);
    songData.instruments = instruments;
    songData.instrumentMask = createInstrumentMask(this.state.songData.instrumentIndex, instruments);
    this.setState( {
      songData: songData
    } );
  }

  sendVolumeEvent = (event) =>
  {
    if("volume" in event)
    {
      const instrumentID = this.state.songData.instrumentIndex[ event.instrument ].id;
      if(this.audio){ this.audio.setVolumeForInstrument( instrumentID, event.volume ); }
    }
    else if("muted" in event)
    {
      const instrumentID = this.state.songData.instrumentIndex[ event.instrument ].id;
      if(this.audio){ this.audio.setMutedForInstrument( instrumentID, event.muted ); }
    }
  }

  handleSettingsChange = (change) =>
  {
    // change returns an object with .key, .value and .local
    if(change.local)
    {
      const updateState = (state) => {
        const modifiedSettings = state.patternSettings.map( (settings, index) => {
          if(index !== state.selectedPattern){ return settings; }
          else {
            return Object.assign(
              {},
              state.patternSettings[state.selectedPattern],
              {[change.key]: change.value}
            );
          }
        });
        return {patternSettings: modifiedSettings};
      };
      this.setState(updateState);
    }
    else
    {
      const updatedSettings = Object.assign(
        {},
        this.state.formatSettings,
        {[change.key]: change.value}
      );
      this.setState(
        {formatSettings: updatedSettings}
      )
    }
  };

  handlePatternsToggle = (e) => {
    this.setState( { patternsOpen : !this.state.patternsOpen } );
  };

  handleSettingsToggle = (e) => {
    this.setState( { settingsOpen : !this.state.settingsOpen } );
  };

  selectPattern = (patternIndex) =>
  {
    // it's important to do this before we re-render components
    if(this.audio)
    {
      this.audio.setActivePattern(
        this.state.songData.patterns[patternIndex].name
      );
    }

    this.setState(
      { selectedPattern: patternIndex }
    );
  };

  onShare = () => {
    SongStorage.put(this.getExportState())
      .then(songID =>{
        const permanentUrl = window.origin + process.env.PUBLIC_URL + "/song/" + songID;
        this.setState({permanentUrl: permanentUrl, sharingDialogOpen: true});
      })
      .catch((err)=>{alert("Couldn't contact external server at this time.")});
  };

  onDownload = () => {
    SongStorage.download(this.getExportState())
  }

  onSave = () => {
    SongStorage.saveToLocalHistory(this.getExportState());
  }

  handleSettingsToggle = (e)=>{
    this.setState({settingsOpen: !this.state.settingsOpen});
  }

  handlePatternsToggle = (e)=>{
    this.setState({patternsOpen: !this.state.patternsOpen})
  }

  closeSharingDialog = ()=>{
    this.setState({sharingDialogOpen:false});
  }

  onPlay = ()=>{
    if(this.audio){ this.audio.play(); }
  }
  onStop = ()=>{
    if(this.audio){ this.audio.stop(); }

  }
  onSetTempo = (tempo)=>{
    if(this.audio){ this.audio.setTempo(tempo); }
  }

  render()
  {
    const pattern = this.state.songData.patterns[
      this.state.selectedPattern
    ];
    const patternSpecifics = ( this.state.songData && this.state.patternSettings) ? this.state.patternSettings[this.state.selectedPattern] : null;
    const resolvedSettings = makeResolvedSettings( this.state.formatSettings, patternSpecifics );
    const mobile = isMobile();
    const instrumentConfigColumns = mobile ? 12 : 8;

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
        />
        <div style={{display: "flex", flexGrow : 1}} />
        <Pattern
          instruments={this.state.songData.instruments}
          tracks={pattern.instrumentTracks}
          config={resolvedSettings}
          patternTime={this.state.patternTime}
        />
        <div style={{display: "flex", flexGrow : 1}} />
        <PlaybackControls
          onPlay={this.onPlay}
          onStop={this.onStop}
          onTempoChange={this.onSetTempo}
        />
        <Grid container>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        <Grid item xs={instrumentConfigColumns}>
        <InstrumentConfig
            instruments={this.state.songData.instruments}
            instrumentIndex={this.state.songData.instrumentIndex}
            instrumentMask={this.state.songData.instrumentMask}
            onChange={this.changeInstruments}
            onVolumeEvent={this.sendVolumeEvent}
          />
        </Grid>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        </Grid>
        <PatternDrawer
          open={this.state.patternsOpen}
          onOpen={this.handlePatternsToggle}
          onClose={this.handlePatternsToggle}
          patterns={this.state.songData.patterns}
          selectPattern={this.selectPattern}
        />
        <SettingsDrawer
          open={this.state.settingsOpen}
          onOpen={this.handleSettingsToggle}
          onClose={this.handleSettingsToggle}
          anchor="right"
          pattern={pattern}
          settings={resolvedSettings}
          onChange={this.handleSettingsChange}
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

export default SongView;
