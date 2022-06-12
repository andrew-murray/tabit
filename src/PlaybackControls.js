import React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

function PlaybackControls(props)
{
  const tempoControlColumns = 4;

  const onPlay = ()=>{ if(props.onPlay){ props.onPlay(); }; };
  const onStop = ()=>{ if(props.onStop){ props.onStop(); }; };
  const onSetTempo = (event, tempo)=>{ if(props.onTempoChange){ props.onTempoChange(tempo); } };
  const tooltipMsg = "Playback disabled while content unlocked."
  const playTooltip = props.disabled ? tooltipMsg : "";
  const stopTooltip = props.disabled ? tooltipMsg : "";

  return (
      <React.Fragment>
        <div>
          <Tooltip title={playTooltip} aria-label={playTooltip}>
            <IconButton
              onClick={props.disabled ? undefined : onPlay}
              disableRipple={props.disabled}
              disableFocusRipple={props.disabled}
            >
              <PlayArrowIcon style={{color: props.disabled ? "#cccccc": "#4cbb17"}}/>
            </IconButton>
          </Tooltip>
          <Tooltip title={stopTooltip} aria-label={stopTooltip}>
            <IconButton
              onClick={props.disabled ? undefined : onStop}
              disableRipple={props.disabled}
              disableFocusRipple={props.disabled}
            >
              <StopIcon style={{color: props.disabled ? "#cccccc": "#ff0800"}}/>
            </IconButton>
          </Tooltip>
        </div>

        <Grid container>
        <Grid item xs={(12 - tempoControlColumns) / 2} />
        <Grid item xs={tempoControlColumns}>
        <Slider
          defaultValue={props.initialTempo ? props.initialTempo : 100}
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

export default React.memo(PlaybackControls);
