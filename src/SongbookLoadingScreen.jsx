import React from 'react'
import WaitingMessage from "./WaitingMessage";
import { Navigate } from "react-router-dom";
import SongbookScreen from "./SongbookScreen";
import {recordAnalyticsEvent} from "./analytics"

export default class SongbookLoadingScreen extends React.Component
{
  state = {
    error: null,
    songbookData: null
  }

  navigateHomeWithError = (err) => {
    window.loadError = err;
    window.error = err;
    const errorString = "Failed to load songbook with id '" + this.props.songbookID + "'. " +
        "This could represent a corrupted songbook or a bug in tabit. Please consider raising an issue in github!" +
        "https://github.com/andrew-murray/tabit/issues\n" +
        "Please provide this as context:\n" +
        JSON.stringify({err: err.toString(), component: "SongbookLoadingScreen"})
    this.setState(
      {
        error: errorString
      }
    );
    recordAnalyticsEvent("Songbook Load Error", {
      songbookID: this.props.songbookID,
      error: err === undefined ? undefined : err.toString()
    });
  }

  componentDidCatch = (err, info) => {
    this.navigateHomeWithError(err);
  }

  componentDidMount()
  {
    const setState = (songbookData) => {
      this.setState(
        { songbookData : songbookData }
      );
      recordAnalyticsEvent("Songbook Load", {title: songbookData.name, songbookID: songbookData.id});
    };

    this.props.storage.get(this.props.songbookID)
      .then(setState)
      .catch(this.navigateHomeWithError);
  }

  render()
  {
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songbookData ? <SongbookScreen styleEnabled={this.props.styleEnabled} editable={this.props.editable} songbookData={this.state.songbookData} navigate={this.props.navigate} location={this.props.location} />
                               : <WaitingMessage message="Loading songbook..."/>;
  }
}