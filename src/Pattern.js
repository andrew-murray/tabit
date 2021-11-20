import React from 'react';
import Part from "./Part";
import PartWithTitle from "./PartWithTitle";
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    fontFamily: "Roboto Mono",
    textAlign: "left",
    whiteSpace:"pre",
    margin: "auto",
    paddingLeft: 10,
    paddingRight: 10,
    "& .activeNote": {
      color: theme.palette.secondary.main
    }
  },
});

const makeCompactConfig = (config, index) => {
  if(index === 0 ){
    return {
      ...config
    };
  }
  else {
    return {
      ...config,
      showBeatNumbers : false
    };
  }
};

const Pattern = React.memo((props)=>
{
  const instrumentIndices = [...props.instruments.keys()];
  const shortNameLengths = props.instruments.map( inst => inst[2].shortName.length );
  const maxShortNameLength = Math.max( ...shortNameLengths );
  const formatShortTitle = (s) => {
    return s + ' '.repeat(maxShortNameLength - s.length);
  };

  const toResolution = (track, resolutionS) => {
    if(!resolutionS) return track;
    const resolution = parseInt(resolutionS);
    if(track.resolution === resolution) return track;
    const compatible = track.compatible(resolution);
    return compatible ? track.format(resolution) : track;
  };
  let tracksForResolution = new Map();
  for(const inst of props.instruments)
  {
    const instrumentIDs = Object.keys(inst[1]);
    // don't reformat patterns, assume them to be in the correct resolution to start
    // with, at the moment this should be true. In future when we actually support
    // "primaryResolution" this will need to be re-enabled
    if(true || !props.config.primaryResolution)
    {
      for( const instID of instrumentIDs )
      {
        tracksForResolution[instID] = props.tracks[instID];
      }
    }
    else
    {
      let instrumentIsCompatible = true;
      for( const instID of instrumentIDs )
      {
        instrumentIsCompatible &= props.tracks[instID].compatible(props.config.primaryResolution);
      }
      for( const instID of instrumentIDs )
      {
        tracksForResolution[instID] = instrumentIsCompatible ?
          toResolution(props.tracks[instID], props.config.primaryResolution)
          : props.tracks[instID];
      }
    }
  }

  if(props.config.compactDisplay)
  {
    // worry about titles in a minute
    return (
      <div style={{"margin": "auto"}}>
        { instrumentIndices.map(
            (instrumentIndex) => ( <Part
              key={"part-" + instrumentIndex.toString()}
              instrument={props.instruments[instrumentIndex][1]}
              tracks={tracksForResolution}
              config={makeCompactConfig(props.config, instrumentIndex)}
              prefix={formatShortTitle(props.instruments[instrumentIndex][2].shortName)}
            />
            )
          )
        }
      </div>
    );
  }
  else
  {
    return (
      <div style={{"margin": "auto"}}>
        { instrumentIndices.map(
            (instrumentIndex) => ( <PartWithTitle
              key={"part-" + instrumentIndex.toString()}
              instrumentName={props.instruments[instrumentIndex][0]}
              instrument={props.instruments[instrumentIndex][1]}
              tracks={tracksForResolution}
              config={props.config}
              dense
            /> )
          )
        }
      </div>
    );
  }
});

class ActivePattern extends React.Component
{
  constructor(props)
  {
    super(props);
    this.ref = React.createRef();
  }

  calculateBeat(config, patternTime)
  {
    const prevBeat = (patternTime !== undefined && patternTime !== null)
      ? Math.floor(patternTime / config.beatResolution)
      : null;
    return prevBeat;
  }

  changePatternTime(prevBeat, beat, force)
  {
    if(beat !== prevBeat || force)
    {
      if(prevBeat !== null)
      {
        const prevElements = this.ref.current.getElementsByClassName("partNote" + prevBeat.toString());
        for( const e of prevElements )
        {
          e.classList.remove("activeNote");
        }
      }
      if(beat !== null)
      {
        const elements = this.ref.current.getElementsByClassName("partNote" + beat.toString());
        for( const e of elements )
        {
          e.classList.add("activeNote");
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    if(prevProps.instruments !== this.props.instruments
      || prevProps.tracks !== this.props.tracks
      || prevProps.config !== this.props.config
      || prevProps.classes !== this.props.classes)
    {
      this.changePatternTime(
        // I don't quite understand why this removal is necessary
        // it seems that react smartly preserves the previous element,
        // so we need to fix its smarts or we change beatResolution partNoteX "stays highlighted"
        this.calculateBeat( prevProps.config, prevProps.patternTime),
        this.calculateBeat( this.props.config, this.props.patternTime),
        true
      );
      return true;
    }
  }

  shouldComponentUpdate(nextProps, nextState)
  {
    // we don't trigger a react-rerender on patternTime changes
    // we handle that in-browser for performance reasons
    if(nextProps.instruments !== this.props.instruments
      || nextProps.tracks !== this.props.tracks
      || nextProps.config !== this.props.config
      || nextProps.classes !== this.props.classes)
    {
      return true;
    }
    else if( nextProps.patternTime !== this.props.patternTime)
    {
      this.changePatternTime(
        this.calculateBeat( this.props.config, this.props.patternTime),
        this.calculateBeat( nextProps.config, nextProps.patternTime),
        true
      );
      return false;
    }
    else
    {
      return false;
    }
  }

  render()
  {
    return (
      <div className={this.props.classes.root} ref={this.ref}>
        <Pattern
          instruments={this.props.instruments}
          tracks={this.props.tracks}
          config={this.props.config}
        />
      </div>
    );
  }
}

export default withStyles(useStyles)(ActivePattern);
