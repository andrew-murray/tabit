import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import SongLoaders from "./SongLoaders"
import * as SongStorage from "./SongStorage";
import SongView from "./SongView"
import {decodeState} from "./SongStorage";
import hash from "object-hash";
import h2 from "./h2"

function WaitingMessage(props)
{
  return (
    <div className="App">
      <div>
        <CircularProgress color="secondary"/>
        <Typography> Loading song... </Typography>
      </div>
    </div>
  );
}

class BlankSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      let history = this.props.history;
      history.push({
        pathname: '/',
        error: "Failed to create new piece '" + this.title + "'. " +
        "This likely represents a bug - please raise an issue in github!"
      });
    };
    SongLoaders.CreateEmpty(this.props.title).then(
      songData => {
        this.setState(
          { songData: songData }
        );
      }
    ).catch(navigateHomeWithError);
  }

  render()
  {
    return this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};

class ExampleSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      let history = this.props.history;
      history.push({
        pathname: '/',
        error: "Failed to load example data. " +
        "This likely represents a bug - please raise an issue in github!"
      });
    };
    SongLoaders.LoadExample().then(
      (songData) => {
        this.setState(
          { songData : songData }
        );
      }
    ).catch(navigateHomeWithError);
  }

  render()
  {
    return this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};

function SongNameFromFile(filename)
{
  if(filename === null || filename === undefined)
  {
    return null;
  }
  if( filename.includes(".") )
  {
    const songTitle = filename.split('.').slice(0, -1).join('.');
    return songTitle;
  }
  else
  {
    return filename;
  }
}

class FileImportSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };
    if(!this.props.filename)
    {
      // silently navigate home
      let history = this.props.history;
      history.push({pathname: '/'});
      return;
    }
    const navigateHomeWithError = (err) => {
      let history = this.props.history;
      history.push({
        pathname: '/',
        error: "Failed to load " + this.props.filename + ". " +
        "If you're sure this is a Hydrogen file, please consider raising an issue in github!"
      });
    };
    if(this.props.filename.includes("h2song"))
    {
      // assume it's a tabit file!
        h2.parseHydrogenPromise(this.props.content)
          .then(h => {
            return SongLoaders.LoadJSON(
              h,
              SongNameFromFile(this.props.filename),
              this.props.filename,
              true // fromHydrogen
            );
          })
          .then(setState)
          .catch(navigateHomeWithError);
    }
    else
    {
      Promise.resolve(this.props.content)
        .then((content)=>{
          // in the case of localStorage API content will be an object already
          return typeof(content) === "string" ? JSON.parse(content) : content;
        })
        .then( data => {
          return SongLoaders.LoadJSON(
            data,
            data.songName ? data.songName : SongNameFromFile(this.props.filename),
            this.props.filename,
            false // fromHydrogen
          );
        } )
        .then(setState)
        .catch(navigateHomeWithError);
    }
  }

  render()
  {
    return this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};


class SongStorageSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };
    const navigateHomeWithError = (err) => {
      let history = this.props.history;
      history.push({
        pathname: '/',
        error: "Failed to load song " + this.props.songID + " from database. " +
        "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!"
      });
    };
    SongStorage.get(this.props.songID)
      .then( data => {
        return SongLoaders.LoadJSON(
          data,
          data.songName,
          data.loadedFile,
          false // fromHydrogen
        );
      } )
      .then(setState)
      .catch(navigateHomeWithError);
  }

  render()
  {
    return this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};

class LocalStorageSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      let history = this.props.history;
      history.push({
        pathname: '/',
        error: "Failed to load recently viewed song " + this.props.name + ". "
      });
    };
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };

    const history = SongStorage.getLocalHistory();
    const matches = history.filter( song => ( song.id === this.props.songID ) );
    if(matches.length < 1)
    {
      // provide no error message, its not currently logged
      navigateHomeWithError();
    }

    Promise.resolve(matches[0])
      .then( (song)=>{
        const stateHash = hash(song.content);
        if( stateHash !== this.props.songID )
        {
          throw new Error("Hash did not match");
        }
        const decodedState = decodeState(song.content);
        return decodedState;
      }).then( data => {
        return SongLoaders.LoadJSON(
          data,
          data.songName,
          data.songName,
          false // fromHydrogen
        );
      }).then(setState)
      .catch(navigateHomeWithError);
    }

    render()
    {
      return this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                                 : <WaitingMessage />;
    }
}

export {
  BlankSongView,
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
};
