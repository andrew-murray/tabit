import React from 'react';
import {isMobile} from "./Mobile";
import { withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClickNHold from 'react-click-n-hold';

const InlinableIconButton = withStyles({
  root: {
    padding: 2
  }
})(IconButton);

export default function VolumeWidget(props)
{
  const [active, setActive] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState(100);
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
    setSliderValue(value);
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
    if(!active){ setActive(true); }
  };

  const holdEndDesktop = (e)=>{
    setActive(false);
  };

  const commitVolume = (event,value)=>
  {
    if( isMobile ){ setActive(false); }
    setVolume(event,value);
  };

  const onMuteChange = () =>
  {
    props.onMuteEvent(!props.muted);
  };

  return (
    <ClickNHold
      time={0.5} // Time to keep pressing. Default is 2
      onClickNHold={isMobile ? holdMobile : holdDesktop}
      onEnd={isMobile ? null : holdEndDesktop} >
      <InlinableIconButton disableRipple disableFocusRipple onClick={onMuteChange} >
        <div style={SliderStyles}>
          <Slider
            defaultValue={100}
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
  );
}