import React from 'react';
import PropTypes from 'prop-types';
import notation from "./notation"
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Button from '@mui/material/Button';
import Divider from "@mui/material/Divider";
import {FormatSettings} from "./formatSettings";
import { isMobile } from "./Mobile";
import TabitBar from "./TabitBar";
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

function SettingsDrawer(props)
{
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const patternDetails = props.pattern ? {
    name : props.pattern.name,
    resolution : props.pattern.resolution,
    length: notation.getPatternLength(props.pattern)
  } : null;

  const noop = () => {};
  const animateChange = (event) => {
    if(props.onChange)
    {
      props.onChange({key: "animate", value: event.target.checked, local: false});
    }
  };
  const interactiveChange = (event) => {
    if(props.onChange)
    {
      props.onChange({key: "interactive", value: event.target.checked, local: false});
    }
  };
  return (
    <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
      className={props.className}
      variant={ isMobile ? undefined : "persistent" }
      anchor={props.anchor}
      open={props.open}
      onOpen={props.onOpen}
      onClose={props.onClose}
      style={{overflow: "hidden"}}
    >
      {!isMobile ? <TabitBar placeholder /> : null }
      {patternDetails &&
        <FormatSettings
          onChange={props.onChange ??  noop}
          settings={props.settings}
          pattern={patternDetails}
          />
      }
      {true &&
        <div>
        <FormControlLabel
          control={<Switch checked={props.animating} onChange={animateChange} name={"Display Beat"} />}
            label={"Display Beat"}
            key={"DisplayBeat"}
        />
        </div>
      }
      {true &&
        <div>
        <FormControlLabel
          control={<Switch checked={props.interactive} onChange={interactiveChange} name={"Enable Editing"} />}
            label={"Enable Editing"}
            key={"EnableEditing"}
        />
        </div>
      }
      {patternDetails && props.onSave &&
        <React.Fragment>
          <Button
            onClick={(e) => { props.onSave(); } }
          >Download</Button>
          <Divider />
        </React.Fragment>
      }
      {patternDetails && props.onShare &&
        <Button
          onClick={(e) => { props.onShare(); } }
        >Share</Button>
      }
    </SwipeableDrawer>
  );
}

SettingsDrawer.propTypes = {
  onSave: PropTypes.func,
  onShare: PropTypes.func,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  anchor: PropTypes.oneOf(['left', 'right']).isRequired,
  settings: PropTypes.object,
  className: PropTypes.string
}

export default React.memo(SettingsDrawer);
