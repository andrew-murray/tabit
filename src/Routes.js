import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import TitleScreen from "./TitleScreen";
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider, responsiveFontSizes } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView
} from "./LazySongViews";

export default function Routes(props) {
  const getSongHistory = ()=>{
    const jsonHistory = localStorage.getItem("tabit-history");
    const songHistory = jsonHistory ? JSON.parse(jsonHistory).sort( (a,b) =>(b.date - a.date) ) : [];
    return songHistory;
  };

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(
    () =>
      createMuiTheme({
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
  );

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Switch>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Route
            exact
            path="/"
            render={(props)=>{
              return <TitleScreen
                history={props.history}
                location={props.location}
                songHistory={getSongHistory()}
              />
            }}
          />
          <Route
            exact
            path="/example"
            render={(props)=>{
              return <ExampleSongView
                history={props.history}
                location={props.location}
              />
            }}
          />
          <Route
            path="/song/:songID"
            render={(props)=>{
              return <SongStorageSongView
                history={props.history}
                location={props.location}
                songID={props.match.params.songID}
              />
            }}
          />
          <Route
            path="/import"
            render={(props)=>{
              console.log(props)
              return <FileImportSongView
                history={props.history}
                location={props.location}
                filename={props.location.filename}
                content={props.location.content}
              />
            }}
          />
        </ThemeProvider>
      </Switch>
    </Router>
  )
};
