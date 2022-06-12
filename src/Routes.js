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
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
} from "./LazySongViews";
import * as SongStorage from "./SongStorage";
import ToneController from "./ToneController"

// expose storage, to enable client-side debugging/manipulation
window.storage = SongStorage;

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

const MakeSongStorageSongView = (props) => {
  const {songID} = useParams();
  const location = useLocation();
  return <SongStorageSongView
    location={location}
    songID={songID}
    songStorage={SongStorage}
    audioController={ToneController}
  />
};

const MakeFileImportSongView = (props) => {
  const location = useLocation();
  return <FileImportSongView
    location={location}
    filename={location.state.filename}
    content={location.state.content}
    songStorage={SongStorage}
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
      audioController={ToneController}
    />
};

export default function TabitRoutes(props) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = responsiveFontSizes( React.useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#d7ccc8'
          },
          secondary: {
            main: '#00acc1'
          }
        },
      }),
    [prefersDarkMode]
  ) );
  const info = process.env.REACT_APP_VERSION_INFO;
  if (!info) {
    console.info("Reporting App Version: No version information present at build time.");
  }
  else
  {
    console.info(`Reporting App Version: ${info}`);
  }

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
            element={<MakeSongStorageSongView />}
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
