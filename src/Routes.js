import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import TitleScreen from "./TitleScreen";
import CssBaseline from '@mui/material/CssBaseline';
import CreateTheme from "./Theme"
import { ThemeProvider } from '@mui/material/styles';
import {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
} from "./LazySongViews";
import * as SongStorage from "./SongStorage";
import ToneController from "./ToneController"

// expose storage, to enable client-side debugging/manipulation
// set to null/undefined to disable save (this may be useless in a constantly-refreshing debugging environment)
window.storage = SongStorage;

const saveCallback = (songState)=>{
  if(window.storage)
  {
    window.storage.saveToLocalHistory(songState);
  }
};

const MakeTitleScreen = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {}
  return (
    <TitleScreen
      navigate={navigate}
      location={location}
      error={locationState.error}
      songStorage={SongStorage}
    />
  );
};

const MakeExample = (props) => {
  const location = useLocation();
  return <ExampleSongView
    location={location}
    songStorage={SongStorage}
    audioController={ToneController}
  />
};

const MakeSongOrLocalStorageSongView = (props) => {
  const {songID} = useParams();
  const location = useLocation();
  if(SongStorage.findLocal(songID))
  {
    const locationState = location.state || {};
    return <LocalStorageSongView
      location={location}
      songID={songID}
      name={locationState.songName}
      songStorage={SongStorage}
      onSave={saveCallback}
      audioController={ToneController}
    />
  }
  else
  {
    return <SongStorageSongView
      location={location}
      songID={songID}
      songStorage={SongStorage}
      onSave={saveCallback}
      audioController={ToneController}
    />
  }
};

const MakeFileImportSongView = (props) => {
  const location = useLocation();
  return <FileImportSongView
    location={location}
    filename={location.state.filename}
    content={location.state.content}
    songStorage={SongStorage}
    onSave={saveCallback}
    audioController={ToneController}
  />
};

const MakeLocalStorageSongView = (props) => {
    const {songID} = useParams();
    const location = useLocation();
    const locationState = location.state || {};
    return <LocalStorageSongView
      location={location}
      songID={songID}
      name={locationState.songName}
      songStorage={SongStorage}
      onSave={saveCallback}
      audioController={ToneController}
    />
};

export default function TabitRoutes(props) {
  const info = process.env.REACT_APP_VERSION_INFO;
  if (!info) {
    console.info("Reporting App Version: No version information present at build time.");
  }
  else
  {
    console.info(`Reporting App Version: ${info}`);
  }

  const theme = CreateTheme();

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
          <Route
            exact
            path="/"
            element={<MakeTitleScreen />}
          />
          <Route
            exact
            path="/example"
            element={<MakeExample />}
          />
          <Route
            path="/song/:songID"
            element={<MakeSongOrLocalStorageSongView />}
          />
          <Route
            path="/import"
            element={ <MakeFileImportSongView />}
          />
          <Route
            path="/recent/:songID"
            element={<MakeLocalStorageSongView />}
          />
        </Routes>
      </ThemeProvider>
    </Router>
  )
};
