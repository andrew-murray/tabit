import React from 'react';
import Part from "./Part";
import PartWithTitle from "./PartWithTitle";
import { withStyles } from '@mui/styles';

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

const TrackView = React.memo((props)=>
{
  const instrumentIndices = [...props.instruments.keys()];
  const shortNameLengths = props.instruments.map( inst => inst[2].shortName.length );
  const maxShortNameLength = Math.max( ...shortNameLengths );
  const formatShortTitle = (s) => {
    return s + ' '.repeat(maxShortNameLength - s.length);
  };
  let resolutionForInstruments = [];
  for(const instIndex of [...Object.keys(props.instruments)])
  {
      const resolutionForInstrument = props.config.useIndividualResolution ?
        props.config.individualResolutions[instIndex].resolution
        : props.config.primaryResolution;
      resolutionForInstruments.push(resolutionForInstrument);
  }
  return (
    <div style={{"margin": "auto"}}>
      { instrumentIndices.map(
          (instrumentIndex) => ( <Part
            key={"part-" + instrumentIndex.toString()}
            instrument={props.instruments[instrumentIndex][1]}
            tracks={props.tracks}
            resolution={resolutionForInstruments[instrumentIndex]}
            config={makeCompactConfig(props.config, instrumentIndex)}
            modifyPatternLocation={props.modifyPatternLocation}
            prefix={formatShortTitle(props.instruments[instrumentIndex][2].shortName)}
          />
          )
        )
      }
    </div>
  );
});

export default TrackView;