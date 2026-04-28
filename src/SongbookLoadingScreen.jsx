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

  componentDidMount()
  {
    const navigateHomeWithError = (err) => {
      window.loadError = err;
      window.error = err;
      this.setState(
        {
          error: "Failed to load songbook with id '" + this.props.songbookID + "'. " +
          "This could represent a corrupted entry/a bug in our software. Please consider raising an issue in github!" +
          "Reported Error:\n" + err
        }
      );
      recordAnalyticsEvent("Songbook Load Error", {
        songbookID: this.props.songbookID,
        error: err === undefined ? undefined : err.toString()
      });
    };
    const setState = (songbookData) => {
      this.setState(
        { songbookData : songbookData }
      );
      recordAnalyticsEvent("Songbook Load", {title: songbookData.name, songbookID: songbookData.id});
    };

    this.props.storage.get(this.props.songbookID)
      .then(setState)
      .catch(navigateHomeWithError);
  }

  render()
  {
    return this.state.error ? <Navigate to="/" state={{error: this.state.error}} />
         : this.state.songbookData ? <SongbookScreen styleEnabled={this.props.styleEnabled} editable={this.props.editable} songbookData={this.state.songbookData} navigate={this.props.navigate} location={this.props.location} />
                               : <WaitingMessage message="Loading songbook..."/>;
  }
}