import React from 'react'
import { withStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import Paper from "@mui/material/Paper";
import {
  Navigate
} from "react-router-dom";
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

function recordAnalyticsEvent(eventType, eventData)
{
  if(window.umami !== undefined)
  {
    window.umami.trackEvent(eventType, eventData);
  }
}

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
    error: this.props.error
  }

  render()
  {
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
    if(this.state.error)
    {
      return <Navigate to="/" state={{error: this.state.error}} />;
    }
    return (
      <Box className="App">
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '100vh', backgroundColor: 'primary.main' }}
        >
          <Box>
            <Typography variant="h2">tabit</Typography>
          </Box>
          <Paper>
            <List>
              {ExampleCollection.songs.map((item)=><ListItem key={item.id} disablePadding>
                <ListItemButton onClick={(e)=>this.props.navigate(`/song/${item.id}`)}>
                  <ListItemIcon>
                    <AudioFileIcon />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>)}
            </List>
          </Paper>
        </Grid>
      </Box>
    );
  }
};

export default withStyles(styles)(CollectionScreen);
