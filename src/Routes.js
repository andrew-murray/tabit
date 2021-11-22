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
import CssBaseline from '@material-ui/core/CssBaseline';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
} from "./LazySongViews";


const MakeTitleScreen = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state || {}
  return (
    <TitleScreen
      navigate={navigate}
      location={location}
      error={locationState.error}
    />
  );
};

const MakeExample = (props) => {
  const location = useLocation();
  return <ExampleSongView
    location={location}
  />
};

const MakeSongStorageSongView = (props) => {
  const {songID} = useParams();
  const location = useLocation();
  return <SongStorageSongView
    location={location}
    songID={songID}
  />
};

const MakeFileImportSongView = (props) => {
  const location = useLocation();
  return <FileImportSongView
    location={location}
    filename={location.state.filename}
    content={location.state.content}
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
