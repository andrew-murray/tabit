import React from 'react';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import SettingsIcon from "@mui/icons-material/Settings";
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ShareIcon from '@mui/icons-material/Share';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import {isMobile} from "./common/Mobile";
import Tooltip from "./common/TabitTooltip";

function TabitBar(props) {
  // we need to render "null" appbars for spacing purposes
  // support them here, so that we can maintain layout parity in one place
  if(props.placeholder)
  {

    return (

      // <AppBar position="fixed" // todo: I'd like to include the AppBar,
      // className={classes.root}> // but it doesn't have the correct effect#
        <Toolbar variant="dense">
        </Toolbar>
      // </AppBar>
    );
  }

  // render app bar on top for desktop,
  return (
    <AppBar position="fixed"
      sx={{backgroundColor: "primary.main", zIndex: (theme)=> theme.zIndex.drawer + (isMobile ? 0 : 20)}}
    >
      <Toolbar variant="dense">
        <IconButton
          color="inherit"
          edge="start"
          component={Link}
          to={props.OutLink}
          >
          {props.OutIcon}
        </IconButton>
        {props.patternsToggle &&
          <Tooltip
            title="Patterns"
            show={props.showHelp}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={props.patternsToggle}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        }
        <div style={{"flexGrow": 1, "overflow": "hidden"}}>
        {props.onTitleClick &&
          <Tooltip
            title="Edit Title"
            show={props.showHelp}
          >
            <Button onClick={props.onTitleClick} color="inherit" style={{"textOverflow": "ellipsis"}}>
              <Typography variant="h6" color="inherit" noWrap>
              {props.title}
              </Typography>
            </Button>
          </Tooltip>
        }
        {
          !props.onTitleClick &&
            <Typography variant="h6" color="inherit" noWrap>
            {props.title}
            </Typography>
        }
        </div>
        {props.onLockUnlock &&
        <Tooltip
          title={props.locked ? "Unlock editing" : "Lock editing"}
          show={props.showHelp}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={props.onLockUnlock}
            >
            {props.locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Tooltip>
        }
        {props.onToggleCompact &&
        <Tooltip
          title={props.compact ? "Show expanded layout" : "Show compact layout"}
          show={props.showHelp}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={props.onToggleCompact}
          >
            {props.compact ? <ViewListIcon /> : <CalendarViewDayIcon />}
          </IconButton>
        </Tooltip>
        }
        {props.onShare &&
        <Tooltip
          title="Share"
          show={props.showHelp}
        >
            <IconButton
            color="inherit"
            aria-label="share"
            edge="start"
            onClick={props.onShare}
            >
            <ShareIcon />
          </IconButton>
        </Tooltip>
        }
        {props.onDownload &&
        <Tooltip
          title="Download"
          show={props.showHelp}
        >
          <IconButton
          color="inherit"
          edge="start"
          onClick={props.onDownload}
          >
            <SaveAltIcon />
          </IconButton>
        </Tooltip>
        }
        {props.settingsToggle &&
        <Tooltip
          title="Notation Settings"
          show={props.showHelp}
        >
          <IconButton
            color="inherit"
            edge="end"
            onClick={props.settingsToggle}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        }
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(TabitBar);
