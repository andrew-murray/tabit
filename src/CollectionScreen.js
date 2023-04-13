import React from 'react'
import { withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import HomeIcon from '@mui/icons-material/Home';
import Paper from "@mui/material/Paper";
import Tooltip from "./TabitTooltip";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Divider from '@mui/material/Divider'
import AddSongDialog from "./AddSongDialog";
import {
  Navigate
} from "react-router-dom";
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import {isMobile} from "./Mobile";

import './App.css';

const styles = (theme)=>{
  return {
    licenseBanner: {
      position: "absolute",
      bottom:0,
      "width": "95%",
      "textAlign": "center",
      "zIndex" : theme.zIndex.drawer
    },
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    }
  };
};

/*
  This will become relevant if we actually have to go fetch state. Currently it's baked in.

function recordAnalyticsEvent(eventType, eventData)
{
  if(window.umami !== undefined)
  {
    window.umami.trackEvent(eventType, eventData);
  }
}

*/

const ExampleCollection = {
  id: "xxx",
  name: "Beasties Beltane 2023",
  songs: [
    {
      id: "640ddf7bebd26539d08d5cd7",
      name:  "Raised by wolves"
    },
    {
      id: "640de010ace6f33a22ed8529",
      name: "Give it up"
    },
    {
      id: "640bc37eace6f33a22ecc67f",
      name: "Express"
    },
    {
      id: "641f0c03c0e7653a059442b5",
      name: "SmolBeast"
    },
    {
      id: "641f0c0face6f33a22fb2bb6",
      name: "Beat About The Bush"
    },
    {
      id: "641f0ad7ace6f33a22fb29c4",
      name: "HellaSwolla"
    }
  ]
};


class CollectionScreen extends React.Component
{
  state = {
    error: this.props.error,
    editing: false,
    addSongDialogOpen: false
  }

  render()
  {
    /*
      This will become relevant if we actually have to go fetch state. Currently it's baked in.

    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load collection " + this.props.name + ". " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
      recordAnalyticsEvent("Collection Load Error", {
        songbookID: this.props.songbookID,
        error: err === undefined ? undefined : err.toString()
      });
    };
    */
    if(this.state.error)
    {
      return <Navigate to="/" state={{error: this.state.error}} />;
    }

    const handleLockUnlock = ()=>{
      this.setState( { editing: !this.state.editing } );
    };

    return (
      <Box className="App">
        <AppBar position="fixed"
          sx={{backgroundColor: "primary.main", zIndex: (theme)=> theme.zIndex.drawer + (isMobile ? 0 : 20)}}
        >
          <Toolbar variant="dense">
            <IconButton
              color="inherit"
              aria-label="home"
              edge="start"
              onClick={(e)=>this.props.navigate('/')}
              >
              <HomeIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" style={{"textOverflow": "ellipsis"}} noWrap>
              tabit
            </Typography>

            <div style={{"flexGrow": 1, "overflow": "hidden"}} />
            {handleLockUnlock &&
            <Tooltip
              title={!this.state.editing ? "Unlock editing" : "Lock editing"}
              show={this.props.showHelp}
            >
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleLockUnlock}
                >
                {!this.state.editing ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
            }
          </Toolbar>
        </AppBar>
        <AddSongDialog
          open={this.state.addSongDialogOpen}
          onClose={()=>(this.setState({addSongDialogOpen: false}))}
          onAddSong={(song)=>{console.log(song)}}
        />
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '100vh', backgroundColor: 'primary.main' }}
        >
          <Button onClick={(e)=>this.props.navigate("/")}>
            <Typography variant="h2">tabit</Typography>
          </Button>
          <Box>
            <Typography variant="h2">{ExampleCollection.name}</Typography>
          </Box>
          <Paper>
            <List>
              {ExampleCollection.songs.map((item)=><ListItem key={item.id} disablePadding>
                <ListItemButton onClick={(e)=>this.props.navigate(`song/${item.id}`)}>
                  <ListItemIcon>
                    <AudioFileIcon />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>)}
              {this.state.editing && <Divider />}
              {this.state.editing &&
                <ListItem
                  key={"add-button"}
                >
                  <ListItemSecondaryAction>
                    <Tooltip
                      title="Add new song"
                      show={this.props.showHelp}
                    >
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={()=>{this.setState({addSongDialogOpen: true})}}
                        aria-label="add"
                      >
                        <AddCircleIcon
                          size="small"
                          edge="end"
                          />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>}
            </List>
          </Paper>
        </Grid>
      </Box>
    );
  }
};

export default withStyles(styles)(CollectionScreen);
