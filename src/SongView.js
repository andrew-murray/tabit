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
// todo: pass the needed .put function via a prop?
import * as SongStorage from "./SongStorage";

const figurePatternSettings = (patterns)=>{
  return Array.from(
    patterns,
    (p) => notation.guessPerPatternSettings( p.instrumentTracks )
  );
};

class SongView extends React.Component
{
  state = {
    selectedPattern: 0,
    progress: 0,
    patternSettings: this.props.songData ? figurePatternSettings(this.props.songData.patterns) : null,
    formatSettings: Object.assign({}, DefaultSettings),
    songData: Object.assign({},this.props.songData),
    settingsOpen: false,
    patternsOpen: false,
    sharingDialogOpen: false
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
      (time)=>{/*this.onPatternTimeChange(time);*/},
      latencyHint
    );
    this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
    const recordHistory = false;
    if(recordHistory)
    {
      // recordSongVisited();
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
      instruments : this.state.songData.instruments,
      instrumentIndex : this.state.songData.instrumentIndex,
      patterns : this.state.songData.patterns,
      songName: this.state.songData.title,
      formatSettings: this.state.formatSettings,
      patternSettings : this.state.patternSettings,
      version: "1.1.0"
    };
  }

  render()
  {
    const pattern = this.state.songData.patterns[
      this.state.selectedPattern
    ];
    let resolvedSettings = Object.assign({}, this.state.formatSettings);
    if(this.state.songData && this.state.patternSettings)
    {
      const patternSettings = this.state.patternSettings[this.state.selectedPattern];
      resolvedSettings = Object.assign(resolvedSettings, patternSettings);
    }

    const handleSettingsChange = (change) =>
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

    const changeInstrumentsCallback = (instruments) => {
      let songData = Object.assign({}, this.state.songData);
      songData.instruments = instruments;
      songData.instrumentMask = createInstrumentMask(this.state.songData.instrumentIndex, instruments);
      this.setState( {
        songData: songData
      } );
    };

    const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mobile = isMobile();
    const instrumentConfigColumns = mobile ? 12 : 8;

    const sendVolumeEvent = (event) =>
    {
      if("volume" in event)
      {
        const instrumentID = this.state.songData.instrumentIndex[ event.instrument ].id;
        this.audio ?? this.audio.setVolumeForInstrument( instrumentID, event.volume );
      }
      else if("muted" in event)
      {
        const instrumentID = this.state.songData.instrumentIndex[ event.instrument ].id;
        this.audio ?? this.audio.setMutedForInstrument( instrumentID, event.muted );
      }
    };

    const handlePatternsToggle = (e) => {
      this.setState( { patternsOpen : !this.state.patternsOpen } );
    };
    const handleSettingsToggle = (e) => {
      this.setState( { settingsOpen : !this.state.settingsOpen } );
    };

    const selectPattern = (patternIndex) =>
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

    const onShare = ()=>{
      SongStorage.put(this.getExportState())
        .then(permanentUrl=>{
          this.setState({permanentUrl: permanentUrl, sharingDialogOpen: true});
        })
        .catch((err)=>{alert("Couldn't contact external server at this time.")});
    };

    return (
      <div className="App">
        <TabitBar
          title={this.state.songData.title}
          settingsToggle={(e)=>{this.setState({settingsOpen: !this.state.settingsOpen})}}
          patternsToggle={(e)=>{this.setState({patternsOpen: !this.state.patternsOpen})}}
        />
        <Pattern
          instruments={this.state.songData.instruments}
          tracks={pattern.instrumentTracks}
          config={resolvedSettings}
          active={this.state.progress}
          // ref={this.pattern}
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
            onChange={changeInstrumentsCallback}
            onVolumeEvent={sendVolumeEvent}
          />
        </Grid>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        </Grid>
        <PatternDrawer
          open={this.state.patternsOpen}
          onOpen={handlePatternsToggle}
          onClose={handlePatternsToggle}
          patterns={this.state.songData.patterns}
          selectPattern={selectPattern}
        />
        <SettingsDrawer
          open={this.state.settingsOpen}
          onOpen={handleSettingsToggle}
          onClose={handleSettingsToggle}
          anchor="right"
          pattern={pattern}
          settings={resolvedSettings}
          onChange={handleSettingsChange}
          // onSave: PropTypes.func,
          onShare ={onShare}
         />
         <SharingDialog
          open={this.state.sharingDialogOpen}
          onClose={()=>{this.setState({sharingDialogOpen:false});}}
          url={this.state.permanentUrl}
          />
      </div>
    );
  }
};

export default SongView;
