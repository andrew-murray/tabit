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
import RenameDialog from "./RenameDialog"
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
    renameDialogOpen: false,
    patternTime: null,
    errorAlert: null,
    locked: true,
    animating: true,
    interactive: false,
    autosave: true
  }

  componentDidMount()
  {
    window.app = this;
    this.createController();
    // save our work when we navigate away via tab-close
    window.addEventListener('beforeunload', this.onSave);
    if(isMobile){ window.addEventListener("visibilitychange", this.onHideView); }

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
    let tempo = this.props.songData.audioState.tempo;
    if(this.audio){
      tempo = this.audio.getTempo();
      this.audio.teardown();
    }
    const latencyHint = isMobile ? "playback" : null;
    const animateCallback = this.createAnimateCallback();
    this.audio = new ToneController(
      this.state.songData.instrumentIndex,
      this.state.songData.patterns,
      tempo,
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

    const oldActivePatternName = this.state.selectedPattern;

    this.setState(
      {
        songData: updatedSongData,
        patternSettings: patternSettings,
        selectedPattern: boundedPatternIndex
      },
      () => {
        // we change away before removing the pattern, this is currently enforced by the ToneController
        this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
        this.audio.removePattern(oldActivePatternName);
      }
    );

  }

  // cells will be at hydrogen-esque-resolution
  cycleCellContent = (modificationCells, instrument) =>
  {
    // note: we'll be provided multiple cells in the case where a pattern is like AAAB
    // we only support the case where all the cells we're updating have identical content
    // and will switch to identical content

    const representativeCell = modificationCells[0];
    // sort by the symbol content, to get intuitive behaviour
    const entries = [...Object.entries(instrument)].sort( (e1, e2)=>{return e1[1] < e1[2];} );

    const currentPattern = notation.clonePattern(
      this.state.songData.patterns[ this.state.selectedPattern ].name,
      this.state.songData.patterns[ this.state.selectedPattern ]
    );

    // so there's redundancy in the songData
    // we have instrumentTracks and also
    // "notes" which contains everything, we should keep notes in sync
    // but at the moment we don't

    let currentActiveTrackIndex = null;
    for( let entryIndex = 0; entryIndex < entries.length; ++entryIndex)
    {
      const entry = entries[entryIndex];
      const trackID = entry[0];
      // first point should be representative, see note above
      if(currentPattern.instrumentTracks[trackID].queryPoint(representativeCell) === 1)
      {
        currentActiveTrackIndex = entryIndex;
        break;
      }
    }
    // increment (allowing for "null")
    const targetTrackIndex = currentActiveTrackIndex === null ? 0
                          : currentActiveTrackIndex === entries.length - 1 ? null
                          : currentActiveTrackIndex + 1;

    const currentTrack = currentActiveTrackIndex === null ? null : currentPattern.instrumentTracks[ entries[currentActiveTrackIndex][0] ];
    const targetTrack = targetTrackIndex === null ? null : currentPattern.instrumentTracks[ entries[targetTrackIndex][0] ];
    for( const cell of modificationCells )
    {
      if( currentTrack )
      {
        currentTrack.setPoint( cell, 0 );
      }
      if(targetTrack)
      {
        targetTrack.setPoint( cell, 1 );
      }
    }
    const modifiedPatterns =
      this.state.songData.patterns.slice(0, this.state.selectedPattern).concat(
      [currentPattern]
    ).concat(
      this.state.songData.patterns.slice(this.state.selectedPattern+1)
    );
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {patterns: modifiedPatterns}
    );
    this.setState(
      {songData: updatedSongData},
      () => {
        if(this.audio)
        {
          this.audio.updatePattern( this.state.songData.patterns[this.state.selectedPattern] );
        }
      }
    );
  }

  addCombinedPattern = (name, recipe) =>
  {
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
        if(this.audio)
        {
          this.audio.updatePattern( pattern );
        }
        this.selectPattern(updatedSongData.patterns.length - 1);
      }
    );
  }

  createNewPatternWithSettings = (name, res, length, trackKeys) =>
  {
    const pattern = notation.createEmptyPattern(
      name,
      res,
      length,
      trackKeys
    );
    const patternSettings = notation.guessPerPatternSettings(pattern.instrumentTracks);

    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {patterns: this.state.songData.patterns.concat(pattern)}
    );
    this.setState(
      {songData: updatedSongData, patternSettings: this.state.patternSettings.concat(patternSettings)},
      () => {
        if(this.audio)
        {
          this.audio.updatePattern( pattern );
        }
        this.selectPattern(updatedSongData.patterns.length - 1)
      }
    );
  }

  createNewPattern = (name) =>
  {
    let patternLength = 48 * 8;
    let patternResolution = 16;
    let trackKeys = [];
    if(true) // always grab details from pattern from now, we don't support having no patterns yet
    {
      const pattern = this.state.songData.patterns[ this.state.selectedPattern ];
      patternLength = pattern.size;
      patternResolution = pattern.resolution;
      trackKeys = Array.from(Object.keys(pattern.instrumentTracks));
    }
    this.createNewPatternWithSettings(name, patternResolution, patternLength, trackKeys);
  }

  handleCreate = (change) =>
  {
    if(change.recipe)
    {
      this.addCombinedPattern(change.name, change.recipe)
    }
    else
    {
      this.createNewPattern(change.name);
    }
  }

  componentWillUnmount()
  {
    // todo: I'd like to detect dev/production and choose not to save in dev, but
    // I seem to be having issues using process.env.NODE_ENV on the client,
    // I could define it apparently but for now just *always* save
    // (It's unclear if this should be available, create-react-app might be set up to provide it
    // and I still seem to have issues during webpack's reload, for modules assuming process exists...
    // if(!!process.env.NODE_ENV && process.env.NODE_ENV === 'production')
    this.onSave();
    window.removeEventListener('beforeunload', this.onSave);
    if(isMobile){ window.removeEventListener("visibilitychange", this.onHideView); }
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
      audioState: this.audio !== null ? this.audio.getExportState() : undefined,
      version: "1.2.0"
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
    // assume that the event is valid and will update the instrument
    const instrumentID = this.state.songData.instrumentIndex[ event.instrument ].id;
    let instrumentToUpdate = this.state.songData.instrumentIndex[ event.instrument ];
    if("volume" in event)
    {
      if(this.audio){ this.audio.setVolumeForInstrument( instrumentID, event.volume ); }
      instrumentToUpdate.volume = event.volume;

    }
    else if("muted" in event)
    {
      if(this.audio){ this.audio.setMutedForInstrument( instrumentID, event.muted ); }
      instrumentToUpdate.muted = event.muted;
    }
    let updatedInstrumentIndex = this.state.songData.instrumentIndex.slice();
    updatedInstrumentIndex[event.instrument] = instrumentToUpdate;

    let updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {instrumentIndex: updatedInstrumentIndex}
    );
    this.setState( {
      songData: updatedSongData
    } );
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
    else if(change.key === "interactive")
    {
      this.setState( {interactive: change.value} );
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

  optionalUnloadAutosave = () => {
    if(this.state.autosave)
    {
      this.onSave();
    }
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

  onEnableRenameDialog = () => {
    this.setState( {renameDialogOpen: true} );
  }

  onDisableRenameDialog = () => {
    this.setState( {renameDialogOpen: false} );
  }

  onRename = (name) =>
  {
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {title: name}
    );
    this.setState(
      {songData: updatedSongData, renameDialogOpen: false}
    );
  }

  render()
  {
    const pattern = this.state.songData.patterns[
      this.state.selectedPattern
    ];
    const patternSpecifics = ( this.state.songData && this.state.patternSettings) ? this.state.patternSettings[this.state.selectedPattern] : null;
    const resolvedSettings = makeResolvedSettings( this.state.formatSettings, patternSpecifics );
    const instrumentConfigColumns = isMobile ? 12 : 8;

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
          onTitleClick={this.onEnableRenameDialog}
        />
        <RenameDialog
          open={this.state.renameDialogOpen}
          onCancel={this.onDisableRenameDialog}
          onChange={this.onRename}
          value={this.state.songData.title}
          instruction="Enter new title"
          requireNonEmpty
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
            modifyPatternLocation={this.state.interactive ? this.cycleCellContent : undefined}
          />
        </div>
        <div style={{display: "flex", flexGrow : 1}} />
        <PlaybackControls
          onPlay={this.onPlay}
          onStop={this.onStop}
          initialTempo={this.props.songData.audioState.tempo}
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
          interactive={this.state.interactive}
         />
        <SharingDialog
          open={this.state.sharingDialogOpen}
          onClose={this.closeSharingDialog}
          url={this.state.permanentUrl}
          />
        <PatternCreateDialog
          open={this.state.patternCreateDialogOpen}
          onClose={this.closePatternCreateDialog}
          onChange={this.handleCreate}
          patterns={[...this.state.songData.patterns.keys()].map(index=>this.state.songData.patterns[index].name)}
        />
      </div>
    );
  }
};

export default SongView;
