import React from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { isMobile } from "./Mobile";

function PlaybackControls(props)
{
  const tempoControlColumns = isMobile ? 10 : 4;

  const onPlay = ()=>{ if(props.onPlay){ props.onPlay(); }; };
  const onStop = ()=>{ if(props.onStop){ props.onStop(); }; };
  const onSetTempo = (event, tempo)=>{ if(props.onTempoChange){ props.onTempoChange(tempo); } };
  const tooltipMsg = "Playback disabled while content unlocked."
  const playTooltip = props.disabled ? tooltipMsg : "";
  const stopTooltip = props.disabled ? tooltipMsg : "";

  return (<Grid container>
        <Grid item xs={(12 - tempoControlColumns) / 2} />
        <Grid item xs={tempoControlColumns}>
          <Paper sx={{px: 5}}>
            <Box>
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
            </Box>

            <Slider
              defaultValue={props.initialTempo ? props.initialTempo : 100}
              min={60}
              step={1}
              max={180}
              onChange={onSetTempo}
              valueLabelDisplay="auto"
              valueLabelFormat={(x)=>x.toString() + " bpm"}
            />
          </Paper>
        </Grid>
        <Grid item xs={(12 - tempoControlColumns ) / 2} />
      </Grid>
    );
};

export default React.memo(PlaybackControls);
