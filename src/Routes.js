import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import SongbookLoadingScreen from "./SongbookLoadingScreen";
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
import {Navigate} from "react-router-dom";
import * as SongStorage from "./SongStorage";
import ToneController from "./ToneController";
import StaticSongbookStorage from "./StaticSongbookStorage";

// expose storage, to enable client-side debugging/manipulation
// set to null/undefined to disable save (this may be useless in a constantly-refreshing debugging environment)
window.storage = SongStorage;

const saveCallback = (songState, songID)=>{
  if(window.storage)
  {
    window.storage.saveToLocalHistory(songState, songID);
  }
};

const MakeTitleScreen = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {}
  return <TitleScreen
    navigate={navigate}
    location={location}
    error={locationState.error}
    songStorage={SongStorage}
  />;
};

const MakeSongbookScreen = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {songbookStorage, songbookID} = useParams();
  if(songbookStorage === 'static')
  {
    return <SongbookLoadingScreen
      navigate={navigate}
      location={location}
      songbookID={songbookID}
      storage={StaticSongbookStorage}
      editable={false}
      styleEnabled={true}
    />;
  }
  else
  {
    const error = `Sorry - I couldn't find that Songbook for you at "${songbookStorage}/${songbookID}"`;
    return <Navigate to="/" state={{error: error}} />;
  }
};

const MakeExample = (props) => {
  const location = useLocation();
  return <ExampleSongView
    location={location}
    songStorage={SongStorage}
    audioController={ToneController}
  />
};

const formatReturnURL = (songbookStorage, songbookID) =>
{
  return songbookID ? `/songbook/${songbookStorage}/${songbookID}` : undefined;
}

const MakeSongOrLocalStorageSongView = (props) => {
  const {songID, songbookStorage, songbookID} = useParams();
  const location = useLocation();
  const returnURL = formatReturnURL(songbookStorage, songbookID);
  const localID = SongStorage.translateLocalSongID(songID);
  if(localID)
  {
    const locationState = location.state || {};
    return <LocalStorageSongView
      location={location}
      songID={localID}
      returnURL={returnURL}
      name={locationState.songName}
      songStorage={SongStorage}
      onSave={(exportState)=>saveCallback(exportState, songID)}
      audioController={ToneController}
    />
  }
  else
  {
    return <SongStorageSongView
      location={location}
      songID={songID}
      returnURL={returnURL}
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
            path="/songbook/:songbookStorage/:songbookID"
            element={<MakeSongbookScreen />}
          />
          <Route
            path="/songbook/:songbookStorage/:songbookID/song/:songID"
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
          <Route
            path="/beasties-beltane-2023"
            element={<Navigate to="/songbook/static/beasties-beltane-2023/" />}
          />
          <Route
            path="/beasties-beltane-2025"
            element={<Navigate to="/songbook/static/beasties-beltane-2025/" />}
          />
          <Route
            path="/enc"
            element={<Navigate to="/songbook/static/enc/" />}
          />
        </Routes>
      </ThemeProvider>
    </Router>
  )
};
