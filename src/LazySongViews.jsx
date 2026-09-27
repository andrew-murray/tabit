import React from 'react'
import SongLoaders from "./SongLoaders"
import SongView from "./SongView"
import hash from "object-hash";
import h2 from "./data/h2"
import WaitingMessage from "./WaitingMessage";
import {
  Navigate
} from "react-router-dom";
import {recordAnalyticsEvent} from "./analytics";

class ExampleSongView extends React.Component
{
  state = {
    songData: null
  }

  navigateHomeWithError = (err) => {
    window.loadError = err;
    window.error = err;
    this.setState(
      {
        error: "Failed to load example data. " +
        "This could represent an important bug - please consider raising an issue in github!\n" +
        "https://github.com/andrew-murray/tabit/issues\n" +
        "Please provide this as context:\n" +
        + JSON.stringify({err: err.toString(), component: "ExampleSongView"})
      }
    );
    recordAnalyticsEvent("Song Load Error [Example]", {
      error: err === undefined ? undefined : err.toString()
    });
  }

  componentDidCatch = (err, info) => {
    this.navigateHomeWithError(err);
  }

  componentDidMount = () =>
  {
    SongLoaders.LoadExample().then(
      (songData) => {
        this.setState(
          { songData : songData }
        );
        return songData;
      }
    )
    .then((songData) => recordAnalyticsEvent("Song Load [Example]", {}))
    .catch(this.navigateHomeWithError);
  }

  render()
  {
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} returnURL={this.props.returnURL} songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage message="Loading song..."/>;
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

  navigateHomeWithError = (err) => {
    window.loadError = err;
    window.error = err;
    const errorString = "Failed to load " + this.props.filename + ". " +
        "If you think this should work, please consider raising an issue in github!\n" +
        "https://github.com/andrew-murray/tabit/issues\n" +
        "Please provide this as context:\n" +
        JSON.stringify({err: err.toString(), component: "FileImportSongView"}, null, 2);
    this.setState(
      {
        error: errorString
      }
    );
    recordAnalyticsEvent("Song Load Error [File]", {
      filename: this.props.filename,
      error: err === undefined ? undefined : err.toString()
    });
  }

  componentDidCatch = (err, info) => {
    this.navigateHomeWithError(err);
  }

  componentDidMount = () =>
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
      recordAnalyticsEvent("Song Load [File]", {
        name: songData.title,
        filename: this.props.filename
      });
      return songData;
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
        .catch(this.navigateHomeWithError);
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
        .catch(this.navigateHomeWithError);
    }
  }

  render()
  {
    return !this.props.filename ? <Navigate to="/"/>
          : this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
          : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} returnURL={this.props.returnURL} songData={this.state.songData} onSave={this.props.onSave} key={this.state.songData}/>
                               : <WaitingMessage  message="Loading song..."/>;
  }
};


class SongStorageSongView extends React.Component
{
  state = {
    songData: null
  }

  navigateHomeWithError = (err) =>
  {
    window.loadError = err;
    window.error = err;
    const errorString = "Failed to load song " + this.props.songID + " from database. " +
        "This could represent a corrupted entry/a bug in tabit - please consider raising an issue in github!\n" +
        "https://github.com/andrew-murray/tabit/issues\n" +
        "Please provide this as context:\n" +
        JSON.stringify({err: err.toString(), component: "SongStorageSongView"}, null, 2);
    this.setState(
      {
        error: errorString
      }
    );
    recordAnalyticsEvent("Song Load Error [SongStorage]", {
      id: this.props.songID,
      error: err === undefined ? undefined : err.toString(),
      url: this.props.songStorage.formatURL(this.props.songID)
    });
  }

  componentDidCatch = (err, info) => {
    this.navigateHomeWithError(err);
  }

  componentDidMount = () =>
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
      recordAnalyticsEvent("Song Load [SongStorage]", {
        name: songData.title,
        id: this.props.songID,
        url: this.props.songStorage.formatURL(this.props.songID)
      });
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
      .catch(this.navigateHomeWithError);
  }


  onSave = (exportState) => {
    if(this.props.onSave)
    {
      this.props.onSave(exportState, this.props.songID);
    }
  }
  render()
  {
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} returnURL={this.props.returnURL} songData={this.state.songData} onSave={this.onSave} key={this.state.songData}/>
                               : <WaitingMessage message="Loading song..."/>;
  }
};

class LocalStorageSongView extends React.Component
{
  state = {
    songData: null
  }

  navigateHomeWithError = (err) =>
  {
    window.loadError = err;
    window.error = err;
    const errorString = "Failed to load recently viewed song " + this.props.name + ". " +
        "This could represent a corrupted entry/a bug in tabit - please consider raising an issue in github!\n" +
        "https://github.com/andrew-murray/tabit/issues\n" +
        "Please provide this as context:\n" +
        JSON.stringify({err: err.toString(), component: "LocalStorageSongView"}, null, 2);
    this.setState(
      {
        error: errorString
      }
    );
    recordAnalyticsEvent("Song Load Error [LocalStorage]", {
      id: this.props.songID,
      error: err === undefined ? undefined : err.toString()
    });
  }

  componentDidCatch = (err, info)  => {
    this.navigateHomeWithError(err);
  }

  componentDidMount = () =>
  {
    console.log("Fetching local record");
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
      recordAnalyticsEvent("Song Load [LocalStorage]", {name: songData.title, id: this.props.songID});
    };

    const history = this.props.songStorage.getLocalHistory();
    const matches = history.filter( song => ( song.id === this.props.songID ) );
    if(matches.length < 1)
    {
      // TODO: Need a direct method? To flag it as less-of-an-error?
      this.navigateHomeWithError("Attempted to load song that didn't exist");
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
      .catch(this.navigateHomeWithError);
    }

    render()
    {
      return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
           : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} returnURL={this.props.returnURL} songData={this.state.songData} onSave={this.props.onSave} key={this.state.songData}/>
                                 : <WaitingMessage message="Loading song..."/>;
    }
}

export {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView,
  LocalStorageSongView
};
