import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import SongLoaders from "./SongLoaders"
import SongView from "./SongView"
import hash from "object-hash";
import h2 from "./h2"
import {
  Navigate
} from "react-router-dom";

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

class ExampleSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      this.setState(
        {
          error: "Failed to load example data. " +
          "This likely represents a bug - please raise an issue in github!"
        }
      );
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
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} songData={this.state.songData} key={this.state.songData}/>
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
    const navigateHomeWithError = (err) => {
      this.setState(
        {
          error: "Failed to load " + this.props.filename + ". " +
          "If you're sure this is a Hydrogen file, please consider raising an issue in github!"
        }
      );
    };
    // if we haven't been provided a filename, early out and
    // redirect home in the render pass
    if(!this.props.filename)
    {
      return;
    }
    if(this.props.filename.includes("h2song"))
    {
      // assume it's a() tabit file!
      h2.parseHydrogenPromise(this.props.content, SongLoaders.TRACK_FORMAT_SPARSE)
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
    return !this.props.filename ? <Navigate to="/"/>
          : this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
          : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} songData={this.state.songData} key={this.state.songData}/>
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
      this.setState(
        {
          error: "Failed to load song " + this.props.songID + " from database. " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
    };
    this.props.songStorage.get(this.props.songID)
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
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} songData={this.state.songData} key={this.state.songData}/>
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
      this.setState(
        {
          error: "Failed to load recently viewed song " + this.props.name + ". " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
    };
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };

    const history = this.props.songStorage.getLocalHistory();
    const matches = history.filter( song => ( song.id === this.props.songID ) );
    if(matches.length < 1)
    {
      navigateHomeWithError();
    }

    Promise.resolve(matches[0])
      .then( (song)=>{
        const stateHash = hash(song.content);
        if( stateHash !== this.props.songID )
        {
          throw new Error("Hash did not match");
        }
        const decodedState = this.props.songStorage.decodeState(song.content);
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
      return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
           : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} songData={this.state.songData} key={this.state.songData}/>
                                 : <WaitingMessage />;
    }
}

export {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
};
