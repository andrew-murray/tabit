import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import FileImport from "./FileImport";
import CircularProgress from '@material-ui/core/CircularProgress';
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
      "backgroundColor" : "#282c34", // same background color as app
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
    error: this.props.error
  }

  render()
  {
    let history = this.props.history;
    const songHistory = this.props.songHistory;
    // if a load of a song is in flight don't show file open buttons
    const handleFileImport = (e) =>
    {
      history.push({
        pathname: '/import',
        filename: e.file.name,
        content: e.content
      });
    };

    const navigateRecent = (song) => {
      console.log(song);
      history.push('/recent/' + song.id + "/");
    };

    const controls = (
      <React.Fragment>
        <Button variant="contained" onClick={()=>{history.push("/example")}} style={{margin: "1em"}}>Load example</Button>
        <FileImport
          style={{margin: "1em"}}
          variant="contained"
          onImport={handleFileImport}
          accept=".tabit,.h2song"
          />
      </React.Fragment>
    );
    const waitingMessage = (<React.Fragment>
        <p> Loading song... </p>
        <CircularProgress />
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
        { songHistory.length > 0 &&
          <History data={songHistory} onClick={navigateRecent}/>
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
