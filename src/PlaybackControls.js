import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';

function PlaybackControls(props)
{
  const tempoControlColumns = 4;

  const onPlay = ()=>{ if(props.onPlay){ props.onPlay(); }; };
  const onStop = ()=>{ if(props.onStop){ props.onStop(); }; };
  const onSetTempo = (event, tempo)=>{ if(props.onTempoChange){ props.onTempoChange(tempo); } };

  return (
      <React.Fragment>
        <div>
          <IconButton
            color="primary"
            aria-label="play"
            onClick={onPlay}
          >
            <PlayArrowIcon />
          </IconButton>
          <IconButton
            color="secondary"
            aria-label="stop"
            onClick={onStop}
          >
            <StopIcon />
          </IconButton>
        </div>

        <Grid container>
        <Grid item xs={(12 - tempoControlColumns) / 2} />
        <Grid item xs={tempoControlColumns}>
        <Slider
          defaultValue={100}
          min={60}
          step={1}
          max={180}
          onChange={onSetTempo}
          valueLabelDisplay="auto"
        />
        </Grid>
        <Grid item xs={(12 - tempoControlColumns ) / 2} />
        </Grid>

      </React.Fragment>
   );
};

export default PlaybackControls;