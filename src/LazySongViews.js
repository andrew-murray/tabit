import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import FileImport from "./FileImport";
import { Alert } from '@material-ui/lab';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import History from "./History";
import SongLoaders from "./SongLoaders"
import * as SongStorage from "./SongStorage";
import SongView from "./SongView"
import h2 from "./h2"

function WaitingMessage(props)
{
  return (
    <React.Fragment>
      <p> Loading song... </p>
      <CircularProgress />
    </React.Fragment>
  );
}

class ExampleSongView extends React.Component
{
  state = {
    songData: null,
    errorMessage: null
  }

  componentDidMount()
  {
    SongLoaders.LoadExample().then(
      (songData) => {
        this.setState(
          { songData : songData }
        );
      }
    ).catch((err)=>{this.setState({
      errorMessage: "Failed to load example data. This likely represents a bug - please raise an issue in github!"
    })});
  }

  render()
  {
    return this.state.errorMessage ? <Alert severity="error">{this.state.errorMessage}</Alert>
        :  this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
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
    songData: null,
    errorMessage: null
  }

  componentDidMount()
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };
    const setError = (err)=>{
      this.setState({
        errorMessage: "Failed to load " + this.props.filename + ". " +
        "This could represent a corrupted file/a bug in our software. Please consider raising an issue in github!"
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
          .catch(setError);
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
        .catch(setError);
    }
  }

  render()
  {
    return this.state.errorMessage ? <Alert severity="error">{this.state.errorMessage}</Alert>
        :  this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};


class SongStorageSongView extends React.Component
{
  state = {
    songData: null,
    errorMessage: null
  }

  componentDidMount()
  {
    const setState = (songData) => {
      this.setState(
        { songData : songData }
      );
    };
    const setError = (err)=>{
      this.setState({
        errorMessage: "Failed to load song " + this.props.songID + " from database. " +
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
      .catch(setError);
  }

  render()
  {
    return this.state.errorMessage ? <Alert severity="error">{this.state.errorMessage}</Alert>
        :  this.state.songData ? <SongView songData={this.state.songData} key={this.state.songData}/>
                               : <WaitingMessage />;
  }
};


export {
  ExampleSongView,
  FileImportSongView,
  SongStorageSongView
};
