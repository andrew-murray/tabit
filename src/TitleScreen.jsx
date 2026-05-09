import React from 'react'
import { styled } from '@mui/material/styles';
import FileImport from "./FileImport";
import Button from '@mui/material/Button';
import History from "./History";
import SongbookHistory from "./SongbookHistory";
import TitledDialog from "./common/TitledDialog"
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
// expose staticSongbooks as history
import StaticSongbookStorage from "./StaticSongbookStorage";
import './App.css';

const LicenseBanner = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  width: "95%",
  textAlign: "center",
  zIndex: theme.zIndex.drawer
}));

class TitleScreen extends React.Component
{
  state = {
    error: this.props.error,
    songHistory: [],
    songbookHistory: []
  }

  componentDidMount = () => {
    this.setState(
      {
        songHistory: this.props.songStorage.getLocalHistory(),
        songbookHistory: StaticSongbookStorage.getAll()
      }
    )
  }

  render()
  {
    // if a load of a song is in flight don't show file open buttons
    const handleFileImport = (e) =>
    {
      this.props.navigate(
        '/import',
        {
          state: {
            filename: e.file.name,
            content: e.content
          }
        }
      );
    };

    const navigateRecent = (song) => {
      this.props.navigate(
        '/recent/' + song.id + "/",
        {
          state: {
            songName: song.name
          }
        }
      );
    };

    const navigateSongbook = (songbookEntry) => {
      this.props.navigate(
        `/songbook/${songbookEntry.source}/${songbookEntry.data.id}`
      );
    };

    const controls = (
      <React.Fragment>
        <Button
          variant="contained"
          onClick={()=>{this.props.navigate("/example")}}
          style={{margin: "1em"}}
          color="secondary"
        >
          Load example
        </Button>
        <FileImport
          style={{margin: "1em"}}
          variant="contained"
          onImport={handleFileImport}
          accept=".tabit,.h2song"
          color="secondary"
          />
      </React.Fragment>
    );
    return (
      <Box className="App">
        <Grid
          container
          direction="column"
          sx={{ minHeight: '100vh', backgroundColor: 'primary.main', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box>
            <Typography variant="h2">tabit</Typography>
            <Typography >I read .h2songs and write tab</Typography >
            {controls}
            <Grid
              container
              sx={{ justifyContent: 'center' }}
            >
              { this.state.songbookHistory.length > 0 &&
                <Grid
                  container
                  direction="column"
                  size={{ xs: 12, sm: 5 }}
                  px={4}
                  py={1}
                  sx={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                  <Paper>
                    <SongbookHistory
                      data={this.state.songbookHistory}
                      onClick={navigateSongbook}
                    />
                  </Paper>
                </Grid>
              }
              { this.state.songHistory.length > 0 &&
                <Grid
                  container
                  direction="column"
                  size={{ xs: 12, sm: 5 }}
                  px={4}
                  py={1}
                  sx={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                  <Paper>
                    <History
                      data={this.state.songHistory}
                      onClick={navigateRecent}
                    />
                  </Paper>
                </Grid>
              }
            </Grid>
          </Box>
        </Grid>
        { !!this.state.error &&
          <TitledDialog
            title="Something went wrong."
            open={!!this.state.error}
            onClose={()=>{this.setState({error: null})}}
          >
            {this.state.error}
          </TitledDialog>
        }
        <LicenseBanner sx={{backgroundColor: 'primary.main', py: 0.5}}>
          <Typography>tabit relies on publicly available sound libraries listed at <Link href="https://github.com/andrew-murray/tabit" color="secondary.main">https://github.com/andrew-murray/tabit</Link>
          </Typography>
        </LicenseBanner>
      </Box>
    );
  }
};

export default TitleScreen;
