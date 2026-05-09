import React from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useLongPress, usePress, mergeProps } from 'react-aria';

import {isMobile} from "../common/Mobile";
import TitledDialog from "../common/TitledDialog";

const InlinableIconButton = styled(IconButton)({ padding: 2 });

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

  const commitVolume = (event, value) =>
  {
    setVolume(event, value);
  };

  const onMuteChange = () =>
  {
    props.onMuteEvent(!props.muted);
  };

  const longPressDidFire = React.useRef(false);

  const { longPressProps } = useLongPress({
    threshold: 500,
    onLongPressStart: () => {
      longPressDidFire.current = true;
      if (isMobile) {
        setDialogActive(true);
      } else {
        setActive(true);
      }
    },
    onLongPressEnd: () => {
      if (!isMobile) {
        setActive(false);
      }
    },
  });

  const { pressProps } = usePress({
    onPress: () => {
      if (!longPressDidFire.current) {
        onMuteChange();
      }
      longPressDidFire.current = false;
    },
  });

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
    <InlinableIconButton disableRipple disableFocusRipple {...mergeProps(longPressProps, pressProps)}>
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
        { props.muted ?  <VolumeOffIcon fontSize="small" data-testid="VolumeOffIcon"/>
        : sliderValue < 10 ? <VolumeMuteIcon fontSize="small" />
        : sliderValue < 50 ? <VolumeDownIcon fontSize="small" />
                           : <VolumeUpIcon fontSize="small" data-testid="VolumeUpIcon"/> }
      </div>
    </InlinableIconButton>
  </>
}