import React from 'react';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import { makeStyles } from '@mui/styles';;


import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import SettingsIcon from "@mui/icons-material/Settings";
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ShareIcon from '@mui/icons-material/Share';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';

const useStyles = makeStyles((theme) => ({
  root: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: theme.palette.primary.main
  }
}));

function TabitBar(props) {
  const classes = useStyles(props);
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

  return (
    <AppBar position="fixed"
      className={classes.root}
    >

      <Toolbar variant="dense">
        {props.patternsToggle && <IconButton
          color="inherit"
          aria-label="open pattern list"
          edge="start"
          onClick={props.patternsToggle}
          >
          <MenuIcon />
        </IconButton>
        }
        <IconButton
          color="inherit"
          aria-label="home"
          edge="start"
          component={Link}
          to='/'
          >
          <HomeIcon />
        </IconButton>
        <div style={{"flexGrow": 1, "overflow": "hidden"}}>
        <Button onClick={props.onTitleClick} color="inherit" style={{"textOverflow": "ellipsis"}}>
          <Typography variant="h6" color="inherit" noWrap>
          {props.title}
          </Typography>
        </Button>
        </div>
        {props.onLockUnlock && <IconButton
          color="inherit"
          aria-label={props.locked ? "unlock" : "lock"}
          edge="start"
          onClick={props.onLockUnlock}
          >
          {props.locked ? <LockIcon /> : <LockOpenIcon />}
        </IconButton>
        }
        {props.onToggleCompact && <IconButton
          color="inherit"
          aria-label={props.compact ? "toggle-to-dense-view" : "toggle-to-compact-view"}
          edge="start"
          onClick={props.onToggleCompact}
          >
          {props.compact ? <ViewListIcon /> : <CalendarViewDayIcon />}
        </IconButton>
        }
        {props.onShare && <IconButton
          color="inherit"
          aria-label="share"
          edge="start"
          onClick={props.onShare}
          >
          <ShareIcon />
        </IconButton>
        }
        {props.onDownload && <IconButton
          color="inherit"
          aria-label="download"
          edge="start"
          onClick={props.onDownload}
          >
          <SaveAltIcon />
        </IconButton>
        }
        {props.settingsToggle && <IconButton
          color="inherit"
          aria-label="open settings"
          edge="end"
          onClick={props.settingsToggle}
        >
          <SettingsIcon />
        </IconButton>
        }
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(TabitBar);
