import React from 'react';
import Pattern from "./PatternDisplay/Pattern";
import PlaybackControls from "./PlaybackControls";
import InstrumentConfig from "./instrumentConfig/InstrumentConfig";
import { createInstrumentMask, guessShortName } from "./data/instrumentation";
import notation from "./data/notation";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/lab/Alert';
import AlertTitle from '@mui/lab/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import TabitBar from "./TabitBar";
import PatternDrawer from "./PatternDrawer"
import SettingsDrawer from "./SettingsDrawer"
import RenameDialog from "./common/RenameDialog"
import { isMobile } from "./common/Mobile";
import SharingDialog from "./SharingDialog";
import PatternCreateDialog from "./PatternCreateDialog";
import Toolbar from '@mui/material/Toolbar';
import memoizeOne from 'memoize-one';
import HomeIcon from '@mui/icons-material/Home';
import BackIcon from '@mui/icons-material/ArrowBackIosNew';

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
    songData: {
      instruments: this.props.songData.instruments,
      instrumentIndex: this.props.songData.instrumentIndex,
      instrumentMask: this.props.songData.instrumentMask,
      patterns: this.props.songData.patterns,
      patternDisplayOrder: this.props.songData.patternDisplayOrder,
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
    interactive: true,
    showHelp: true,
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
    if(this.props.audioController)
    {
      let tempo = this.props.songData.audioState.tempo;
      if(this.audio){
        tempo = this.audio.getTempo();
        this.audio.teardown();
      }
      const latencyHint = isMobile ? "playback" : null;
      const animateCallback = this.createAnimateCallback();
      this.audio = new this.props.audioController(
        this.state.songData.instruments,
        this.state.songData.instrumentIndex,
        this.state.songData.patterns,
        tempo,
        animateCallback,
        latencyHint,
        this.setError
      );
      this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
    }
  }

  removePattern = (displayIndex) =>
  {
    if(this.audio){this.audio.stop();}

    if( this.state.songData.patterns.length === 1 )
    {
      // don't let the app get into a bad state
      return this.setError("Can't delete the last pattern")
    }

    const index = this.state.songData.patternDisplayOrder[displayIndex];
    const indices = [...Array(this.state.songData.patterns.length).keys()].filter(ix => ix !== index);
    const newPatterns = indices.map( ix => this.state.songData.patterns[ix] );
    const patternSettings =  indices.map( ix => this.state.patternSettings[ix] );
    // remove the pattern we're removing... (could alternatively remove the element at displayIndex)
    const patternDisplayOrderWithoutDeleted = this.state.songData.patternDisplayOrder.filter(ix => ix !== index);
    // decrement elements referencing a pattern higher-in-index than the one we've removed
    const newPatternDisplayOrder = patternDisplayOrderWithoutDeleted.map(ix => ix >= index ? ix - 1 : ix);

    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {
        patterns: newPatterns,
        patternDisplayOrder: newPatternDisplayOrder
      }
    );
    // if ix === selected, use the lower pattern index
    // ix < selected shift down by one to keep the same pattern
    // ix > selected, keep the same index
    const samePatternIndex = index <= this.state.selectedPattern ? this.state.selectedPattern - 1 : this.state.selectedPattern;
    // note that since we sometimes shift down, let's just bound ourselves sanely
    const boundedPatternIndex = Math.min( Math.max( 0, samePatternIndex ), indices.length - 1 );
    const removedPatternName = this.state.songData.patterns[index].name;
    // const patternDisplayOrder = this.state.songData.patternDisplayOrder.
    this.setState(
      {
        songData: updatedSongData,
        patternSettings: patternSettings,
        selectedPattern: boundedPatternIndex
      },
      () => {
        // we change away before removing the pattern, this is currently enforced by the AudioController
        if(this.audio)
        {
          this.audio.setActivePattern( this.state.songData.patterns[this.state.selectedPattern].name );
          this.audio.removePattern(removedPatternName);
        }
      }
    );

  }

  // cells will be at hydrogen-esque-resolution
  cycleCellContent = (modificationCells, instrument, resolutionForInstrument) =>
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

    let anyUndefined = false;
    for(const cell of modificationCells)
    {
      // in theory, we should be able to just take the first cell, but let's be paranoid here
      anyUndefined |= notation.isCellUndefinedSparse(
        instrument,
        currentPattern.instrumentTracks,
        resolutionForInstrument,
        cell
      );
    }
    if(anyUndefined)
    {
      // undefined means that (i) some track has multiple notes in the
      // range (as represented) ... for example if we're rendering quarter-notes
      // but at eight-note-resolution we would see "-X--" this is undefined
      // or (ii) we have multiple tracks hitting on the beat

      // in both cases we clear the whole content, so that we can cycle next time
      for(const cell of modificationCells)
      {
        for( let entryIndex = 0; entryIndex < entries.length; ++entryIndex)
        {
          const entry = entries[entryIndex];
          const trackID = entry[0];
          const lower = cell;
          const higher = cell + resolutionForInstrument;
          currentPattern.instrumentTracks[trackID].clearRange(lower, higher);
        }
      }
    }
    else
    {
      // no undefined, so we cycle the remaining tracks
      let currentActiveTrackIndex = null;
      for( let entryIndex = 0; entryIndex < entries.length; ++entryIndex)
      {
        const entry = entries[entryIndex];
        const trackID = entry[0];
        // first point should be representative, see note above
        if(currentPattern.instrumentTracks[trackID].queryPoint(representativeCell))
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
          currentTrack.setPoint( cell, 0, 1.0 );
        }
        if(targetTrack)
        {
          targetTrack.setPoint( cell, 1, 1.0 );
        }
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

  addCombinedPattern = (name, recipe, synchronous) =>
  {
    let pattern = notation.clonePattern(name, this.state.songData.patterns[recipe[0].value]);
    for(let recipeIndex = 1; recipeIndex < recipe.length; ++recipeIndex)
    {
      if(synchronous)
      {
        pattern = notation.combinePatternsSynchronous(
          name,
          pattern,
          this.state.songData.patterns[recipe[recipeIndex].value]
        );
      }
      else
      {
        pattern = notation.combinePatternsConsecutive(
          name,
          pattern,
          this.state.songData.patterns[recipe[recipeIndex].value]
        );
      }
    }

    const patternSettings = notation.guessPerPatternSettings(
      pattern.instrumentTracks,
      this.state.songData.instruments
    );
    const newPatternDisplayOrder = this.state.songData.patternDisplayOrder.concat( this.state.songData.patterns.length );

    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {
        patterns: this.state.songData.patterns.concat(pattern),
        patternDisplayOrder: newPatternDisplayOrder
      }
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
      trackKeys,
      true // sparse
    );
    const patternSettings = notation.guessPerPatternSettings(pattern.instrumentTracks, this.state.songData.instruments);
    const newPatternDisplayOrder = this.state.songData.patternDisplayOrder.concat( this.state.songData.patterns.length );
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {
        patterns: this.state.songData.patterns.concat(pattern),
        patternDisplayOrder: newPatternDisplayOrder
      }
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
      this.addCombinedPattern(change.name, change.recipe, change.synchronous)
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
      patternDisplayOrder: this.state.songData.patternDisplayOrder,
      songName: this.state.songData.title,
      formatSettings: this.state.formatSettings,
      patternSettings : this.state.patternSettings,
      audioState: this.audio !== null ? this.audio.getExportState() : undefined,
      version: "1.3.0"
      // , timestamp: Date.now(), timestamps will mean we continuously regenerate new autosaves at new hashes... think this through
    };
  }

  onInstrumentChangeRequest = (event) =>
  {
    if(event.kind === "rename")
    {
      const instrumentName = event.name;
      const instrumentIndex = event.index;
      let replacedInstruments = this.state.songData.instruments.slice();
      let replacedInstrument = replacedInstruments[instrumentIndex].slice();
      replacedInstrument[0] = instrumentName;
      replacedInstrument[2] = {shortName: guessShortName(instrumentName)};
      // in this case ... the audioController doesn't need to do any work
      replacedInstruments[instrumentIndex] = replacedInstrument;
      this.handleReplaceInstruments(
        replacedInstruments
      );
    }
    else if(event.kind === "symbol")
    {
      const instrumentID = this.state.songData.instrumentIndex[event.index].id;
      const instrumentIndex = this.state.songData.instruments.findIndex( instrument => instrumentID in instrument[1]);
      let replacedInstruments = this.state.songData.instruments.slice();
      let replacedInstrument = replacedInstruments[instrumentIndex].slice();
      const replacedMapping = Object.assign(
        {},
        replacedInstrument[1],
        {[instrumentID]: event.symbol}
      );
      replacedInstrument[1] = replacedMapping;
      replacedInstruments[instrumentIndex] = replacedInstrument;
      this.handleReplaceInstruments(
        replacedInstruments
      );
    }
    else if(event.kind === "create")
    {
      const instrumentName = event.name;
      const extraInstrument = [
        instrumentName,
        {},
        {shortName: guessShortName(instrumentName)},
        {muted: false, volume: 0.8}
      ];
      const replacedInstruments = this.state.songData.instruments.slice().concat([extraInstrument]);
      this.handleReplaceInstruments(
        replacedInstruments,
        ()=>{
          if(this.audio){ this.audio.createNewInstrument(extraInstrument[3]); }
        }
      );
    }
    else if(event.kind === "remove")
    {
      const removeIndex = event.index;
      const instrumentToRemove = this.state.songData.instruments[event.index];
      const startInstruments = this.state.songData.instruments.slice(0, event.index);
      const endInstruments = this.state.songData.instruments.slice(event.index + 1);
      const replacedInstruments = startInstruments.concat(endInstruments);
      this.handleReplaceInstruments(
        replacedInstruments,
        ()=>{
          const connectedTrackIDs = Array.from(Object.keys(instrumentToRemove[1]));
          if(this.audio){ this.audio.removeInstrument(removeIndex, connectedTrackIDs); }
        }
      );
    }
    else
    {
      this.setError("Unsupported instrument changeRequest " + event.toString());
      return;
    }
  }

  handleReplaceInstruments = (replacedInstruments, callback = undefined) =>
  {
    let songData = Object.assign({}, this.state.songData);
    songData.instruments = replacedInstruments;
    songData.instrumentMask = createInstrumentMask(this.state.songData.instrumentIndex, replacedInstruments);
    this.setState(
      { songData: songData },
      callback
    );
  }

  handleInstrumentReassign = (trackIndex, instrumentIndex, event) =>
  {
    const x = trackIndex;
    const y = instrumentIndex;
    const instrumentID = this.state.songData.instrumentIndex[x].id;
    const oldInstrumentIndex = this.state.songData.instruments.findIndex( instrument => instrumentID in instrument[1]);
    const dstInstrumentIndex = y;
    if( oldInstrumentIndex === dstInstrumentIndex )
    {
      return;
    }
    const oldInstrument = oldInstrumentIndex !== -1 ? this.state.songData.instruments[oldInstrumentIndex] : null;

    // build new instrument
    let replacedSrcInstrument = [
      "", // name
      {}, // symbol to trackID mapping
      {}, // metadata,
      {} // volumeSettings
    ];
    if( oldInstrument != null )
    {
      // create new instrument, preserving old mappings
      // that aren't tied to the track we're moving away
      replacedSrcInstrument[0] = oldInstrument[0];
      // shortname/metadata copy over
      replacedSrcInstrument[2] = oldInstrument[2];
      for( const key of Object.keys(oldInstrument[1]) )
      {
        if( key !== instrumentID.toString() )
        {
          replacedSrcInstrument[1][key] = oldInstrument[1][key];
        }
      }
      replacedSrcInstrument[3] = oldInstrument[3];
    }
    let dstInstrument = [
      this.state.songData.instruments[dstInstrumentIndex][0],
      Object.assign({}, this.state.songData.instruments[dstInstrumentIndex][1] ),
      ...this.state.songData.instruments[dstInstrumentIndex].slice(2)
    ];
    if(oldInstrument != null )
    {
      dstInstrument[1][instrumentID.toString()] = oldInstrument[1][instrumentID];
    }
    else
    {
      dstInstrument[1][instrumentID.toString()] = "X";
    }

    // construct instrument array
    let replacedInstruments = [];

    for(let instrumentIndex = 0; instrumentIndex < this.state.songData.instruments.length; ++instrumentIndex)
    {
      if( instrumentIndex === oldInstrumentIndex )
      {
        replacedInstruments.push( replacedSrcInstrument );
      }
      else if( instrumentIndex === dstInstrumentIndex )
      {
        replacedInstruments.push( dstInstrument )
      }
      else
      {
        replacedInstruments.push( this.state.songData.instruments[instrumentIndex] );
      }
    }
    // set state
    this.handleReplaceInstruments(
      replacedInstruments,
      () => {
        if(this.audio){
          this.audio.rewireTrackToInstrument(
            oldInstrumentIndex === -1 ? null : oldInstrumentIndex,
            dstInstrumentIndex === -1 ? null : dstInstrumentIndex,
            instrumentID
          );
        }
      }
    );
  }


  resizeCurrentPattern = (size) =>
  {
    const currentPattern = this.state.songData.patterns[this.state.selectedPattern];
    const updatedPattern = notation.createResizedPattern(currentPattern.name, currentPattern, size);
    const newPatterns = [...Array(this.state.songData.patterns.length).keys()].map(
      (ix) => ix === this.state.selectedPattern ? updatedPattern : this.state.songData.patterns[ix]
    );
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {
        patterns: newPatterns
      }
    );
     this.setState(
      {
        songData: updatedSongData
      },
      () => {
        // we change away before removing the pattern, this is currently enforced by the AudioController
        if(this.audio)
        {
          const playing = this.audio.isPlaying();
          if(playing){ this.audio.stop();}
          this.audio.updatePattern(newPatterns[this.state.selectedPattern] );
          if(playing){this.audio.play();}
        }
      }
    );
  }

  updateInstrumentIndex = (instrumentIndex) =>
  {
    const instrumentMask = createInstrumentMask(instrumentIndex, this.state.songData.instruments);
    this.setState(
      {
        songData: Object.assign(
          Object.assign( {}, this.state.songData ),
          { instrumentMask, instrumentIndex }
        )
      },
      () => {
        if(this.audio)
        {
          const playing = this.audio.isPlaying();
          if(playing){ this.audio.stop();}
          this.audio.instrumentIndex = instrumentIndex;
          let recordFailures = [];
          this.audio.populateSamples(
            this.state.songData.instruments,
            this.audio.instrumentGains,
            instrumentIndex,
            this.state.songData.patterns[this.state.selectedPattern].instrumentTracks,
            recordFailures
          );
          this.audio.updatePattern(this.state.songData.patterns[this.state.selectedPattern] );
          if(playing){this.audio.play();}
        }
      }
    )
  }

  sendVolumeEventForTrack = (event) => 
  {
    // assume that the event is valid and will update the instrument
    let updatedInstrumentIndex = this.state.songData.instrumentIndex.slice();
    if(event.solo !== undefined)
    {
      const trackIsMuted = updatedInstrumentIndex.map(inst => inst.muted);
      const indicesToToggle = this.getIndicesToToggleWhenSoloing(event.track, trackIsMuted);
      for(const index of indicesToToggle)
      {
        const originalTrack = updatedInstrumentIndex[ index ];
        if(this.audio){ this.audio.setMutedForTrack( originalTrack.id, !originalTrack.muted ); }
        updatedInstrumentIndex[index] = Object.assign(
          {},
          originalTrack,
          {muted: !originalTrack.muted}
        );
      }
    }
    else
    {
      const trackID = this.state.songData.instrumentIndex[ event.track ].id;
      let trackToUpdate = this.state.songData.instrumentIndex[ event.track ];
      if(event.volume !== undefined)
      {
        if(this.audio){ this.audio.setVolumeForTrack( trackID, event.volume ); }
        trackToUpdate.volume = event.volume;
      }
      else if(event.muted !== undefined)
      {
        if(this.audio){ this.audio.setMutedForTrack( trackID, event.muted ); }
        trackToUpdate.muted = event.muted;
      }
      else
      {
        this.setError("Unexpected volume change event " + event.toString());
        return;
      }
      updatedInstrumentIndex[event.track] = trackToUpdate;
    }
    let updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {instrumentIndex: updatedInstrumentIndex}
    );
    this.setState( {
      songData: updatedSongData
    } );
  }

  getIndicesToToggleWhenSoloing(selectedIndex, componentIsMuted)
  {
    const otherIndices = [...Array(componentIsMuted.length).keys()].filter(ix => ix !== selectedIndex);
    const unmutedIndices = otherIndices.filter( (index) => !componentIsMuted[index] );
    // if we have some unmuted instruments, mute them
    // otherwise unmute them all
    const otherIndicesToToggle = unmutedIndices.length === 0 ? otherIndices : unmutedIndices;
    const selectedComponentMuted = componentIsMuted[selectedIndex];
    const indicesToToggle = !selectedComponentMuted ? otherIndicesToToggle
                                                    : [...otherIndicesToToggle, selectedIndex];
    return indicesToToggle;
  }

  sendVolumeEventForInstrument = (event) =>
  {
    // todo: need to un-mutable everything in the long-term
    let updatedInstruments = this.state.songData.instruments.map( inst => inst.slice() );
    if(event.solo !== undefined)
    {
      const instrumentIsMuted = updatedInstruments.map(inst => inst[3].muted);
      const indicesToToggle = this.getIndicesToToggleWhenSoloing(event.instrument, instrumentIsMuted);
      for(const index of indicesToToggle)
      {
        const originalInstrument = updatedInstruments[ index ].slice();
        if(this.audio){ this.audio.setMutedForInstrumentIndex( index, !originalInstrument[3].muted ); }
        originalInstrument[3] = Object.assign(
          {},
          originalInstrument[3],
          {muted: !originalInstrument[3].muted}
        );
        updatedInstruments[index] = originalInstrument;
      }
    }
    else
    {
      let instrumentToUpdate = updatedInstruments[event.instrument];
      if(event.muted !== undefined)
      {
        if(this.audio){ this.audio.setMutedForInstrumentIndex( event.instrument, event.muted ); }
        instrumentToUpdate[3] = Object.assign(
          {},
          instrumentToUpdate[3],
          {muted: event.muted}
        );
      }
      else if(event.volume !== undefined)
      {
        if(this.audio){ this.audio.setVolumeForInstrumentIndex( event.instrument, event.volume ); }
        instrumentToUpdate[3] = Object.assign(
          {},
          instrumentToUpdate[3],
          {volume: event.volume}
        );
      }
    }
    let updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {instruments: updatedInstruments}
    );
    this.setState( {
      songData: updatedSongData
    } );
  }

  sendVolumeEvent = (event) =>
  {
    if(event.track !== undefined)
    {
      this.sendVolumeEventForTrack(event);
    }
    else if(event.instrument !== undefined)
    {
      this.sendVolumeEventForInstrument(event);
    }
    else
    {
      this.setError("Unexpected volume change event " + event.toString());
      return;
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
    else if(change.key === "showHelp")
    {
      this.setState({showHelp: change.value});
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

  selectPatternDisplayIndex = (displayIndex) => {
    const index = this.state.songData.patternDisplayOrder[displayIndex];
    this.selectPattern(index);
  }

  onShare = () => {
    this.props.songStorage.put(this.getExportState())
      .then(songID =>{
        const permanentUrl = window.origin + process.env.PUBLIC_URL + "/song/" + songID;
        this.setState({permanentUrl: permanentUrl, sharingDialogOpen: true});
      })
      .catch((err)=>{alert("Couldn't contact external server at this time.")});
  };

  onDownload = () => {
    this.props.songStorage.download(this.getExportState())
  }

  closePatternCreateDialog = () => {
    this.setState({patternCreateDialogOpen: false});
  }

  openPatternCreateDialog = () => {
    this.setState({patternCreateDialogOpen: true});
  }

  onSave = () => {
    if(this.props.onSave)
    {
      this.props.onSave(this.getExportState());
    }
  }

  onHideView = () => {
      this.onStop();
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


  setPatternDisplayOrder = (patternDisplayIndices) =>
  {
    const updatedSongData = Object.assign(
      Object.assign({}, this.state.songData),
      {patternDisplayOrder: patternDisplayIndices}
    );

    this.setState({
      songData: updatedSongData
    });
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
      <Box className="App">
        <Toolbar variant="dense"/>
        <TabitBar
          title={this.state.songData.title}
          OutLink={this.props.returnURL ? this.props.returnURL : '/' }
          OutIcon={this.props.returnURL ? <BackIcon/> : <HomeIcon />}
          settingsToggle={this.handleSettingsToggle}
          patternsToggle={this.handlePatternsToggle}
          onShare={this.onShare}
          onDownload={this.onDownload}
          locked={this.state.locked}
          onLockUnlock={this.onToggleLocked}
          onTitleClick={this.onEnableRenameDialog}
          onToggleCompact={this.onToggleCompact}
          showHelp={this.state.showHelp}
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
        <Grid container>
        <Box sx={{
          display: "flex",
          overflowX: "auto",
          flexDirection: "column",
          justifyContent: "safe center",
          width: "100%",
          maxWidth: "100%",
          pb: 1
        }}>
          <Pattern
            instruments={this.state.songData.instruments}
            tracks={pattern.instrumentTracks}
            config={resolvedSettings}
            patternTime={this.state.patternTime}
            modifyPatternLocation={(this.state.interactive && !this.state.locked) ? this.cycleCellContent : undefined}
          />
        </Box>
        </Grid>
        <div style={{display: "flex", flexGrow : 1}} />
        <PlaybackControls
          onPlay={this.onPlay}
          onStop={this.onStop}
          initialTempo={this.props.songData.audioState.tempo}
          onTempoChange={this.onSetTempo}
          disabled={!this.state.locked}
        />
        <Box sx={{
          display: "flex",
          overflowX: "auto",
          flexDirection: "column",
          justifyContent: "safe center",
          width: "100%",
          maxWidth: "100%",
          py: 1
        }}>
        <Grid container>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        <Grid item xs={instrumentConfigColumns}>
          <InstrumentConfig
              instruments={this.state.songData.instruments}
              instrumentIndex={this.state.songData.instrumentIndex}
              instrumentMask={this.state.songData.instrumentMask}
              onInstrumentReassign={this.handleInstrumentReassign}
              onChangeRequest={this.onInstrumentChangeRequest}
              onInstrumentIndexChange={this.updateInstrumentIndex}
              onVolumeEvent={this.sendVolumeEvent}
              showAdvanced={!this.state.locked}
              showHelp={this.state.showHelp}
            />
        </Grid>
        {instrumentConfigColumns < 12 ? <Grid item xs={(12 - instrumentConfigColumns) / 2} /> : null}
        </Grid>
        </Box>
        <PatternDrawer
          open={this.state.patternsOpen}
          onOpen={this.handlePatternsToggle}
          onClose={this.handlePatternsToggle}
          patterns={this.state.songData.patterns}
          selectPattern={this.selectPatternDisplayIndex}
          onRemove={!this.state.locked ? this.removePattern : undefined}
          onAdd={!this.state.locked ? this.openPatternCreateDialog : undefined}
          showHelp={this.state.showHelp}
          patternDisplayOrder={this.state.songData.patternDisplayOrder}       
          setPatternDisplayOrder={!this.state.locked ? this.setPatternDisplayOrder : undefined }
        />
        <SettingsDrawer
          open={this.state.settingsOpen}
          onOpen={this.handleSettingsToggle}
          onClose={this.handleSettingsToggle}
          anchor="right"
          pattern={pattern}
          settings={resolvedSettings}
          onChange={this.handleSettingsChange}
          animating={this.state.animating}
          showHelp={this.state.showHelp}
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
      </Box>
    );
  }
};

export default SongView;
