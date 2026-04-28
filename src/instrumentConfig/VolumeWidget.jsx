import React from 'react';
import { withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClickNHold from 'react-click-n-hold';

import {isMobile} from "../common/Mobile";
import TitledDialog from "../common/TitledDialog";

const InlinableIconButton = withStyles({
  root: {
    padding: 2
  }
})(IconButton);

function VolumeDialog(props)
{
  return <TitledDialog
    open={props.open}
    onClose={props.onClose}
    title={props.instrumentName + " Volume"}
  >
    <div
      style={{display: "flex", justifyContent: "center"}}
    >
      <Slider
        value={props.sliderValue}
        orientation={props.orientation ==="landscape" ? "horizontal" : "vertical"}
        aria-labelledby={props.orientation ==="landscape" ? "horizontal-slider" : "vertical-slider"}
        onChange={props.onChange}
        style={props.orientation === "landscape" ? {minWidth: "50vw", marginLeft: 25} : {minHeight: "50vh", marginTop: 25}}
      />
    </div>
  </TitledDialog>
}

export default function VolumeWidget(props)
{
  // on desktop we have click'n'hold and drag semantics
  // on mobile, on long-press we open a dialog
  const [active, setActive] = React.useState(false);
  const [dialogActive, setDialogActive] = React.useState(false);
  const sliderRef = React.useRef(null);
  const height = props.height ? props.height / 3 : 24;
  const FixedHeightStylings = {
    height: 3*height,
    position: "absolute",
    top: -height
  };
  const SliderStyles = Object.assign(active? {} : {"visibility": "hidden", paddingLeft: "0px"}, FixedHeightStylings);
  const IconStyles = active ?  {"visibility":"hidden"} : {};

  // currently: updating based on the normal volume event isn't nearly performant enough
  // (because the app's state update is really sluggish)
  // potential fixes - seperate the audio and the visual state and/or create smaller state objects
  const setVolume = (event, value) =>
  {
    if( props.onChange )
    {
      props.onChange( value );
    }
  };

  // for mobile
  // we click'n'hold which opens the volume slider, but don't propagate focus

  // for desktop/tablet
  // we click'n'hold and propagate focus to the slider, so that our drag
  // will pull the slider up and down
  const holdDesktop = (start, event)=>{
    if(!active){ setActive(true); }
    if(sliderRef){ sliderRef.current.dispatchEvent(event.nativeEvent);}
  };

  const holdMobile= (start, event)=>{
    if(!dialogActive){ setDialogActive(true); }
  };

  const holdEndDesktop = (e)=>{
    setActive(false);
  };

  const commitVolume = (event,value)=>
  {
    setVolume(event,value);
  };

  const onMuteChange = () =>
  {
    props.onMuteEvent(!props.muted);
  };

  const sliderValue = props.volume * 100;
  return <>
    {dialogActive && <VolumeDialog 
        open={dialogActive}
        onClose={()=>{setDialogActive(false)}}
        instrumentName={props.instrumentName}
        onChange={commitVolume}
        orientation={props.orientation}
        sliderValue={sliderValue}
      />
    }
    <ClickNHold
      time={0.5} // Time to keep pressing. Default is 2
      onClickNHold={isMobile ? holdMobile : holdDesktop}
      onEnd={isMobile ? null : holdEndDesktop} >
      <InlinableIconButton disableRipple disableFocusRipple onClick={onMuteChange} >
        <div style={SliderStyles}>
          <Slider
            value={sliderValue}
            orientation="vertical"
            aria-labelledby="vertical-slider"
            onChange={commitVolume}
            ref={sliderRef}
          />
        </div>
        <div style={IconStyles}>
          { props.muted ?  <VolumeOffIcon fontSize="small" />
          : sliderValue < 10 ? <VolumeMuteIcon fontSize="small" />
          : sliderValue < 50 ? <VolumeDownIcon fontSize="small" />
                             : <VolumeUpIcon fontSize="small"/> }
        </div>
      </InlinableIconButton>
    </ClickNHold>
  </>
}