import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';


import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import HomeIcon from '@material-ui/icons/Home';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import SettingsIcon from "@material-ui/icons/Settings";
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import ShareIcon from '@material-ui/icons/Share';

const useStyles = makeStyles((theme) => ({
  root: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: theme.palette.secondary
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
        <IconButton
          color="inherit"
          aria-label="open pattern list"
          edge="start"
          onClick={props.patternsToggle}
          >
          <MenuIcon />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="home"
          edge="start"
          component={Link}
          to='/'
          >
          <HomeIcon />
        </IconButton>
        <Typography variant="h6" color="inherit" noWrap style={{"flexGrow": 1, "textOverflow": "ellipsis"}}>
          {props.title}
        </Typography>
        <IconButton
          color="inherit"
          aria-label="download"
          edge="start"
          onClick={props.onDownload}
          >
          <SaveAltIcon />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="download"
          edge="start"
          onClick={props.onShare}
          >
          <ShareIcon />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="open settings"
          edge="end"
          onClick={props.settingsToggle}
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(TabitBar);
