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
import memoizeOne from 'memoize-one';

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
    patternSettings: this.props.songData.patternSettings,
    formatSettings: this.props.songData.formatSettings,
    songData: {instruments: this.props.songData.instruments,
        instrumentIndex: this.props.songData.instrumentIndex,
        instrumentMask: this.props.songData.instrumentMask,
        patterns: this.props.songData.patterns,
        title: this.props.songData.title
    },
    settingsOpen: false,
    patternsOpen: true,
    sharingDialogOpen: false,
    patternCreateDialogOpen: false,
    patternTime: null,
    errorAlert: null,
    locked: true,
    animating: true
  }

  componentDidMount()
  {
    this.createController();
    // save our work when we navigate away via tab-close
    window.addEventListener('beforeunload', this.onSave);
    if(isMobile()){ window.addEventListener("visibilitychange", this.onHideView); }

  }
  createAnimateCallback()
  {
    const animateCallback = (time)=>{
      if(window.trace)
      {
        window.trace("animate step " + String(time));
      }
      const nullCheck = (this.state.patternTime === null) !== (time === null);
      const currentBeatResolution = this.state.patternSettings[this.state.selectedPattern].beatResolution;
      const currentBeat = Math.floor(this.state.patternTime / currentBeatResolution);
      const nextBeat =  Math.floor(time / currentBeatResolution);
      if( nullCheck || currentBeat !== nextBeat )
      {
        if(window.trace)
        {
          window.trace(
            "setting pattern time (currentBeat, nextBeat, state.patternTime, time) ("
            + String(currentBeat) + ", " + String(nextBeat) + "," + String(this.state.patternTime) + "," + String(time)
            +  ")"
          );
        }

        this.setState( {patternTime: time } );
      }
    };
    return animateCallback;
  }

  createController()
  {
    if(this.audio){ this.audio.teardown(); }
    const latencyHint = isMobile() ? "playback" : null;
    const animateCallback = this.createAnimateCallback();
    this.audio = new ToneController(
      this.state.songData.instrumentIndex,
      this.state.songData.patterns,
      100.0,
      animateCallback,
      latencyHint,
      this.setError
    );
    this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
  }

  removePattern = (index) =>
  {
    if(this.audio){this.audio.stop();}

    if( this.state.songData.patterns.length === 1 )
    {
      // don't let the app get into a bad state
      return this.setError("Can't delete the last pattern")
    }

    const indices = [...Array(this.state.songData.patterns.length).keys()].filter(ix => ix !== index);
    const newPatterns = indices.map( ix => this.state.songData.patterns[ix] );
    const patternSettings =  indices.map( ix => this.state.patternSettings[ix] );
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {patterns: newPatterns}
    );
    // if ix === selected, use the lower pattern index
    // ix < selected shift down by one to keep the same pattern
    // ix > selected, keep the same index
    const samePatternIndex = index <= this.state.selectedPattern ? this.state.selectedPattern - 1 : this.state.selectedPattern;
    // note that since we sometimes shift down, let's just bound ourselves sanely
    const boundedPatternIndex = Math.min( Math.max( 0, samePatternIndex ), indices.length - 1 );

    this.setState(
      {
        songData: updatedSongData,
        patternSettings: patternSettings,
        selectedPattern: boundedPatternIndex
      },
      () => {
        this.createController();
      }
    );

  }

  addCombinedPattern = (name, recipe) =>
  {
    if(this.audio){this.audio.stop();}

    let pattern = notation.clonePattern(name, this.state.songData.patterns[recipe[0].value]);
    for(let recipeIndex = 1; recipeIndex < recipe.length; ++recipeIndex)
    {
      pattern = notation.combinePatterns(name, pattern, this.state.songData.patterns[recipe[recipeIndex].value])
    }

    const patternSettings = notation.guessPerPatternSettings(pattern.instrumentTracks);

    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {patterns: this.state.songData.patterns.concat(pattern)}
    );

    this.setState(
      {songData: updatedSongData, patternSettings: this.state.patternSettings.concat(patternSettings)},
      () => {
        this.createController();
      }
    );
  }

  componentWillUnmount()
  {
    // save our work, as we may be about to navigate away somewhere else in tabit
    // disabled my default in dev mode as we're likely to do things to screw up state
    if(!!process.env.NODE_ENV && process.env.NODE_ENV === 'production')
    {
      this.onSave();
    }
    window.removeEventListener('beforeunload', this.onSave);
    if(isMobile()){ window.removeEventListener("visibilitychange", this.onHideView); }
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
    // TODO: volume & muted should not be ephemeral, they should go into
    // exportState so that a mixing-profile can be preserved
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
    // manipulate audio's state directly
    if(change.key === "animate")
    {
      if(change.value === true)
      {
        this.setState(
          {animating: true},
          () => {
            if(this.audio){ this.audio.setAnimateCallback(this.createAnimateCallback()); }
          }
        )
      }
      else
      {
        this.setState(
          {animating: false},
          () => {
            if(this.audio) { this.audio.setAnimateCallback(null); }
          }
        )
      }
      return;
    }
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

  closePatternCreateDialog = () => {
    this.setState({patternCreateDialogOpen: false});
  }

  openPatternCreateDialog = () => {
    this.setState({patternCreateDialogOpen: true});
  }

  onSave = () => {
    SongStorage.saveToLocalHistory(this.getExportState());
  }

  onHideView = () => {
      this.onStop();
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

  onPlay = () => {
    if(this.audio){ this.audio.play(); }
  }

  onStop = () => {
    if(this.audio){ this.audio.stop(); }
    // this in most cases seems to be already covered by the animation
    // but not all cases
    this.setState({patternTime: null});
  }

  onSetTempo = (tempo) => {
    if(this.audio){ this.audio.setTempo(tempo); }
  }

  setError = (message) => {
    this.setState({errorAlert: message});
  }

  onToggleLocked = () => {
    this.setState(
      (state)=>{
        const nowLocked = !state.locked;
        if(!nowLocked && this.audio){ this.audio.stop(); }
        // if we're unlocking the patterns, pop open the pattern drawer
        return {locked: nowLocked, patternsOpen: state.patternsOpen || !nowLocked};
      }
    );
  }

  onToggleCompact = ()  => {
    this.setState(
      (state)=>{
        const nowCompact = !this.state.formatSettings.compactDisplay;
        const updatedSettings = {
          ...this.state.formatSettings,
          compactDisplay: nowCompact
        };
        return {formatSettings: updatedSettings};
      }
    );
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
          onShare={this.onShare}
          locked={this.state.locked}
          onLockUnlock={this.onToggleLocked}
          compact={this.state.formatSettings.compactDisplay}
          onToggleCompact={this.onToggleCompact}
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
        <div style={{
          display: "flex",
          overflowX: "auto",
          flexDirection: "column",
          justifyContent: "safe center",
          width: "100%",
          maxWidth: "100%"
        }}>
          <Pattern
            instruments={this.state.songData.instruments}
            tracks={pattern.instrumentTracks}
            config={resolvedSettings}
            patternTime={this.state.patternTime}
          />
        </div>
        <div style={{display: "flex", flexGrow : 1}} />
        <PlaybackControls
          onPlay={this.onPlay}
          onStop={this.onStop}
          onTempoChange={this.onSetTempo}
          disabled={!this.state.locked}
        />
        <div style={{
          display: "flex",
          overflowX: "auto",
          flexDirection: "column",
          justifyContent: "safe center",
          width: "100%",
          maxWidth: "100%"
        }}>
        <Grid container>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        <Grid item xs={instrumentConfigColumns}>
          <InstrumentConfig
              instruments={this.state.songData.instruments}
              instrumentIndex={this.state.songData.instrumentIndex}
              instrumentMask={this.state.songData.instrumentMask}
              onChange={this.changeInstruments}
              onVolumeEvent={this.sendVolumeEvent}
              showAdvanced={!this.state.locked}
            />
        </Grid>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        </Grid>
        </div>
        <PatternDrawer
          open={this.state.patternsOpen}
          onOpen={this.handlePatternsToggle}
          onClose={this.handlePatternsToggle}
          patterns={this.state.songData.patterns}
          selectPattern={this.selectPattern}
          onRemove={!this.state.locked ? this.removePattern : undefined}
          onAdd={!this.state.locked ? this.openPatternCreateDialog : undefined}
        />
        <SettingsDrawer
          open={this.state.settingsOpen}
          onOpen={this.handleSettingsToggle}
          onClose={this.handleSettingsToggle}
          anchor="right"
          pattern={pattern}
          settings={resolvedSettings}
          onChange={this.handleSettingsChange}
          onSave={this.onDownload}
          animating={this.state.animating}
         />
        <SharingDialog
          open={this.state.sharingDialogOpen}
          onClose={this.closeSharingDialog}
          url={this.state.permanentUrl}
          />
        <PatternCreateDialog
          open={this.state.patternCreateDialogOpen}
          onClose={this.closePatternCreateDialog}
          onChange={(change)=>{this.addCombinedPattern(change.name, change.recipe)}}
          patterns={[...this.state.songData.patterns.keys()].map(index=>this.state.songData.patterns[index].name)}
        />
      </div>
    );
  }
};

export default SongView;
