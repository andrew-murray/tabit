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
  for(const instIndex of [...Object.keys(props.instruments)])
  {
    const inst = props.instruments[instIndex];
    const instrumentIDs = Object.keys(inst[1]);
    const resolutionForInstrument = props.config.useIndividualResolution ?
      props.config.individualResolutions[instIndex].resolution
      : props.config.primaryResolution;

    let instrumentIsCompatible = true;
    for( const instID of instrumentIDs )
    {
      instrumentIsCompatible &= props.tracks[instID].compatible(resolutionForInstrument);
    }
    for( const instID of instrumentIDs )
    {
      // TODO: Support rendering an undefined symbol for incompatible resolutions
      tracksForResolution[instID] = instrumentIsCompatible ?
        toResolution(props.tracks[instID], resolutionForInstrument)
        : props.tracks[instID];
    }
  }

  if(props.config.compactDisplay)
  {
    return (
      <div style={{"margin": "auto"}}>
        { instrumentIndices.map(
            (instrumentIndex) => ( <Part
              key={"part-" + instrumentIndex.toString()}
              instrument={props.instruments[instrumentIndex][1]}
              tracks={tracksForResolution}
              config={makeCompactConfig(props.config, instrumentIndex)}
              modifyPatternLocation={props.modifyPatternLocation}
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
              modifyPatternLocation={props.modifyPatternLocation}
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
          modifyPatternLocation={this.props.modifyPatternLocation}
        />
      </div>
    );
  }
}

export default withStyles(useStyles)(ActivePattern);
