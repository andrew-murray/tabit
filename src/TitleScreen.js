import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import FileImport from "./FileImport";
import Button from '@material-ui/core/Button';
import History from "./History";
import TitledDialog from "./TitledDialog"
import './App.css';

const styles = (theme)=>{
  return {
    licenseBanner: {
      position:"absolute",
      bottom:0,
      "width": "95%",
      "textAlign": "center",
      "backgroundColor" : "#212121", // same background color as app
      "zIndex" : theme.zIndex.drawer
    },
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    }
  };
};

class TitleScreen extends React.Component
{
  state = {
    error: this.props.error,
    songHistory: []
  }

  componentDidMount = () => {
    this.setState(
      {songHistory: this.props.songStorage.getLocalHistory()}
    )
  }

  render()
  {
    // if a load of a song is in flight don't show file open buttons
    const handleFileImport = (e) =>
    {
      this.props.navigate(
        '/import',
        {
          state: {
            filename: e.file.name,
            content: e.content
          }
        }
      );
    };

    const navigateRecent = (song) => {
      this.props.navigate(
        '/recent/' + song.id + "/",
        {
          state: {
            songName: song.name
          }
        }
      );
    };

    const controls = (
      <React.Fragment>
        <Button variant="contained" onClick={()=>{this.props.navigate("/example")}} style={{margin: "1em"}}>Load example</Button>
        <FileImport
          style={{margin: "1em"}}
          variant="contained"
          onImport={handleFileImport}
          accept=".tabit,.h2song"
          />
      </React.Fragment>
    );
    const { classes } = this.props;
    return (
      <div className="App">
        <div>
          <h2>tabit</h2>
          <p>I read .h2songs and write tab</p>
          {controls}
        </div>
        <div style={{"marginLeft" : "auto", "marginRight": "auto"}}>
        { this.state.songHistory.length > 0 &&
          <History data={this.state.songHistory} onClick={navigateRecent}/>
        }
        </div>
        { !!this.state.error &&
          <TitledDialog
            title="Something went wrong."
            open={!!this.state.error}
            onClose={()=>{this.setState({error: null})}}
          >
            {this.state.error}
          </TitledDialog>
        }
        <div className={classes.licenseBanner} >
          <p>tabit relies on publicly available sound libraries listed at <a href="https://github.com/andrew-murray/tabit">https://github.com/andrew-murray/tabit</a></p>
        </div>
      </div>
    );
  }
};

export default withStyles(styles)(TitleScreen);
