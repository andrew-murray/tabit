import React from 'react'
import SongLoaders from "./SongLoaders"
import SongView from "./SongView"
import hash from "object-hash";
import h2 from "./h2"
import WaitingMessage from "./WaitingMessage";
import {
  Navigate
} from "react-router-dom";

function recordAnalyticsEvent(eventType, eventData)
{
  if(window.umami !== undefined)
  {
    window.umami.trackEvent(eventType, eventData);
  }
}

class ExampleSongView extends React.Component
{
  state = {
    songData: null
  }

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load example data. " +
          "This likely represents a bug - please raise an issue in github!"
        }
      );
      recordAnalyticsEvent("Song Load Error [Example]", {
        error: err === undefined ? undefined : err.toString()
      });
    };
    SongLoaders.LoadExample().then(
      (songData) => {
        this.setState(
          { songData : songData }
        );
        return songData;
      }
    )
    .then((songData) => recordAnalyticsEvent("Song Load [Example]", {}))
    .catch(navigateHomeWithError);
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

  componentDidMount()
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
      recordAnalyticsEvent("Song Load [File]", {
        title: songData.title,
        filename: this.props.filename
      });
      return songData;
    };
    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load " + this.props.filename + ". " +
          "If you're sure this is a Hydrogen file, please consider raising an issue in github!"
        }
      );
      recordAnalyticsEvent("Song Load Error [File]", {
        filename: this.props.filename,
        error: err === undefined ? undefined : err.toString()
      });
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
          : this.state.songData ? <SongView audioController={this.props.audioController} songStorage={this.props.songStorage} returnURL={this.props.returnURL} songData={this.state.songData} onSave={this.props.onSave} key={this.state.songData}/>
                               : <WaitingMessage  message="Loading song..."/>;
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
      recordAnalyticsEvent("Song Load [SongStorage]", {
        title: songData.title,
        songID: this.props.songID,
        url: this.props.songStorage.formatURL(this.props.songID)
      });
    };
    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load song " + this.props.songID + " from database. " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
      recordAnalyticsEvent("Song Load Error [SongStorage]", {
        songID: this.props.songID,
        error: err === undefined ? undefined : err.toString(),
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
      .catch(navigateHomeWithError);
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

  componentDidMount()
  {
    console.log("Fetching local record")
    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load recently viewed song " + this.props.name + ". " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
      recordAnalyticsEvent("Song Load Error [LocalStorage]", {
        songID: this.props.songID,
        error: err === undefined ? undefined : err.toString()
      });
    };
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
      recordAnalyticsEvent("Song Load [LocalStorage]", {title: songData.title, songID: this.props.songID});
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
