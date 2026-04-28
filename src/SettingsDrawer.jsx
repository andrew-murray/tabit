import React from 'react';
import PropTypes from 'prop-types';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Button from '@mui/material/Button';
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { isMobile } from "./common/Mobile";
import Tooltip from "./common/TabitTooltip";
import notation from "./data/notation"
import {FormatSettings} from "./FormatSettings";
import TabitBar from "./TabitBar";

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
  const helpChange = (event) => {
    if(props.onChange)
    {
      props.onChange({key: "showHelp", value: event.target.checked, local: false});
    }
  }
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
      <Box sx={{overflowY: "auto", "py": 1, display: "flex", flexDirection: "column", alignItems: "center"}}>
        {false &&
          <Box>
          <FormControlLabel
            control={<Switch checked={props.animating} onChange={animateChange} name={"Highlight Beat"} />}
              label={"Highlight Beat"}
              key={"HighlightBeat"}
          />
          </Box>
        }
        {true &&
          <Box>
          <FormControlLabel
            control={<Switch checked={props.showHelp} onChange={helpChange} name={"Show Help"} />}
              label={"Show Help"}
              key={"ShowHelp"}
          />
          </Box>
        }
        {false &&
          <Box>
          <Tooltip
            title="Enable note editing when unlocked"
            show={props.showHelp}
          >
            <FormControlLabel
              control={<Switch checked={props.interactive} onChange={interactiveChange} name={"Enable Note Editing"} />}
                label={"Enable Note Editing"}
                key={"EnableNoteEditing"}
            />
          </Tooltip>
          </Box>
        }
        {patternDetails && props.onSave &&
            <Button variant="contained"
              onClick={(e) => { props.onSave(); } }
            >Download</Button>
        }
        {patternDetails && props.onSave && props.onShare &&
          <Divider />
        }
        {patternDetails && props.onShare &&
          <Button variant="contained"
            onClick={(e) => { props.onShare(); } }
          >Share</Button>
        }
        {patternDetails &&
          <FormatSettings
            onChange={props.onChange ??  noop}
            settings={props.settings}
            pattern={patternDetails}
            showHelp={props.showHelp}
            />
        }
      </Box>
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
