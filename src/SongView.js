import React from 'react';
import Pattern from "./Pattern";
import PlaybackControls from "./PlaybackControls";
import {FormatSettings, DefaultSettings} from "./formatSettings";
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
    patternsOpen: false,
    sharingDialogOpen: false,
    patternTime: null
  }

  constructor(props)
  {
    super(props);
  }

  componentDidMount()
  {
    // is this  a prop?
    const latencyHint = isMobile() ? "playback" : null;
    // always default tempo to 100bpm for now
    this.audio = new ToneController(
      this.state.songData.instrumentIndex,
      this.state.songData.patterns,
      100.0,
      (time)=>{
        if( time / 48 != this.state.patternTime / 48 )
        {
          this.setState( {patternTime: time} )
        }
      },
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
      .then(permanentUrl=>{
        this.setState({permanentUrl: permanentUrl, sharingDialogOpen: true});
      })
      .catch((err)=>{alert("Couldn't contact external server at this time.")});
  };

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

  render()
  {
    const pattern = this.state.songData.patterns[
      this.state.selectedPattern
    ];
    const patternSpecifics = ( this.state.songData && this.state.patternSettings) ? this.state.patternSettings[this.state.selectedPattern] : null;
    const resolvedSettings = makeResolvedSettings( this.state.formatSettings, patternSpecifics );

    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mobile = isMobile();
    const instrumentConfigColumns = mobile ? 12 : 8;

    return (
      <div className="App">
        // todo: make this unnecessary, it ensures pattern renders in the right place right now
        <Toolbar variant="dense"/>
        <TabitBar
          title={this.state.songData.title}
          settingsToggle={this.handleSettingsToggle}
          patternsToggle={this.handlePatternsToggle}
        />
        <Pattern
          instruments={this.state.songData.instruments}
          tracks={pattern.instrumentTracks}
          config={resolvedSettings}
          patternTime={this.state.patternTime != null ? this.state.patternTime : undefined}
        />
        <PlaybackControls
          onPlay={()=>{if(this.audio){this.audio.play();}}}
          onStop={()=>{if(this.audio){this.audio.stop();}}}
          onTempoChange={(tempo)=>{if(this.audio){this.audio.setTempo(tempo);}}}
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
          // onSave: PropTypes.func, # don't currently support download.
          onShare={this.onShare}
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
