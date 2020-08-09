import React from 'react';
import clsx from 'clsx';
import FileImport from "./FileImport";
import Pattern from "./Pattern";
import h2 from './h2';
import './App.css';

import { Alert } from '@material-ui/lab';

// define mui theme, including responsiveFont
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

// drawer
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Divider from "@material-ui/core/Divider";

// notationSettings

import {FormatSettings, DefaultSettings} from "./formatSettings";
import {createInstrumentMask, InstrumentConfig} from "./instrumentConfig";
import { activeInstrumentation, figureInstruments, DEFAULT_INSTRUMENT_SYMBOLS } from "./instrumentation";

import Grid from '@material-ui/core/Grid';
import useMediaQuery from '@material-ui/core/useMediaQuery';

// load static data
import kuva from "./kuva.json";
import track from "./track";

import SoundBoard from "./SoundBoard";
import LinearProgress from '@material-ui/core/LinearProgress';

// mui theme config
let theme = createMuiTheme( { 
  palette: { 
    type: 'dark',
    primary: { main: '#36d9be' },
    secondary: { main: '#f50057' }
   } 
} );

class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      instruments : null,
      instrumentIndex : null,
      instrumentMask : null,
      patterns : null,
      selectedPattern : null,
      loadedFile : null,
      settingsOpen : false,
      patternsOpen : false,
      formatSettings : Object.assign({}, DefaultSettings),
      progress : 0
    };
  }

  handleFileImport(e)
  {
    // e = { file : , content : }
    h2.parseHydrogenPromise(e.content).then(h => {
      const assessedInstruments = figureInstruments(h.instruments, DEFAULT_INSTRUMENT_SYMBOLS, h.patterns);
      const instrumentIndex = activeInstrumentation(h.instruments, h.patterns);
      this.setState({
        instrumentIndex : instrumentIndex,
        instrumentMask : createInstrumentMask(instrumentIndex, assessedInstruments),
        instruments : assessedInstruments,
        patterns : h.patterns,
        selectedPattern : h.patterns.length === 0 ? null : 0,
        loadedFile : e.file.name,
        patternsOpen : true
      });
    });
  }

  selectPattern(patternIndex)
  {
    this.setState( { selectedPattern: patternIndex } );
  }


  // todo: this is a separate component!
  renderPattern(pattern, settings)
  {
    const changeInstrumentsCallback = (instruments) => {
      this.setState( {
        instruments : instruments,
        instrumentMask : createInstrumentMask(this.state.instrumentIndex, instruments)
      } );
    }

    const setProgress = (playbackPosition) => {
      this.setState({progress : 100 * playbackPosition});
    };

    return (
      <React.Fragment>
        <Pattern 
          instruments={this.state.instruments} 
          tracks={pattern.instrumentTracks}
          config={this.state.formatSettings}
        />        
        <Grid container>
        <Grid item xs={4} />
        <Grid item xs={4}>
        <LinearProgress variant="determinate" value={this.state.progress}/>
        </Grid>
        <Grid item xs={4} />
        </Grid>

        <SoundBoard 
          instruments={this.state.instruments} 
          instrumentIndex={this.state.instrumentIndex} 
          tracks={pattern.instrumentTracks}
          onPlaybackPositionChange={setProgress}
        />
        <Grid container>
        <Grid item xs={2} />
        <Grid item xs={8}>
          <InstrumentConfig
            instruments={this.state.instruments}
            instrumentIndex={this.state.instrumentIndex}
            instrumentMask={this.state.instrumentMask}
            onChange={changeInstrumentsCallback}
          />
        </Grid>
        <Grid item xs={2} />
        </Grid>
      </React.Fragment>
    );
  }



  loadExample()
  {
    const createObjects = (state) => 
    {
      // the instruments currently work as simple objects
      // we need to create tracks!
      for( let pattern of state.patterns )
      {
        let replacedTracks = {};
        // todo: find a more compact way of doing this
        for( const [id, trackData] of Object.entries(pattern.instrumentTracks) )
        {
          replacedTracks[id] = new track( trackData.rep, trackData.resolution );
        }
        pattern.instrumentTracks = replacedTracks;
      }
      return state;
    }
    const k = createObjects(kuva);
    const assessedInstruments = figureInstruments(k.instruments, DEFAULT_INSTRUMENT_SYMBOLS, k.patterns);
    const instrumentIndex = activeInstrumentation(k.instruments, k.patterns);
    this.setState({
      instrumentIndex : instrumentIndex,
      instrumentMask : createInstrumentMask(instrumentIndex, assessedInstruments),
      instruments : assessedInstruments,
      patterns : k.patterns,
      selectedPattern : k.patterns.length === 0 ? null : 0,
      loadedFile : "kuva.example",
      patternsOpen : true
    });
  }

  checkMobile()
  {
    // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  }

  // todo: this will go away eventually, once I choose how to load a file
  // (though it should obviously be another component anyway)
  renderMainContent()
  {
    if(this.state.patterns == null || this.state.patterns.length === 0)
    {
      const showAlert = this.state.patterns != null && this.state.patterns.length === 0;
      const optionalAlert = showAlert ? ( <Alert severity="error">{this.state.loadedFile} contained no patterns! Try another.</Alert> )
                                      : "";
      return (
        <div>
          <h2>tabit</h2>
          <p>I read .h2songs and write tab</p>
          <Button variant="contained" onClick={this.loadExample.bind(this)}>See an example</Button>
          <p>Or import your own</p>
          <FileImport
            onImport={this.handleFileImport.bind(this)}
            />
            {optionalAlert}
        </div>
      );      
    }
    else
    {
      let patternContent = null;
      // default title 
      if( this.state.selectedPattern == null )
      {
        patternContent = [];
        for( const pattern of this.state.patterns ) {
          patternContent.push( this.renderPattern(pattern) );
        }
      }
      else
      {
        const patternToRender = this.state.patterns[this.state.selectedPattern];
        patternContent = this.renderPattern(patternToRender);
      }
       
      const ignoreEvent = (event) => {
        return event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift');
      };

      const settingsChangeCallback = (config) => {
        this.setState( { formatSettings: config } );
      };

      const handleDrawerOpen = (e) => {
        if( ignoreEvent(e) ){ return; }
        this.setState( {settingsOpen : true} );
      };

      const handleDrawerClose = (e) => {
        if( ignoreEvent(e) ){ return; }
        this.setState( {settingsOpen : false} );
      };

      const handlePatternsClose = (e) => {
        if( ignoreEvent(e) ){ return; }
        this.setState( { patternsOpen : false } );
      };
      const handlePatternsOpen = (e) => {
        if( ignoreEvent(e) ){ return; }
        this.setState( { patternsOpen : true } );
      };

      const classes = this.props;
      const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const mobile = this.checkMobile();

      return (
        <React.Fragment>
          <div style={{display:"flex", width: "95%"}}> 
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handlePatternsOpen}
              className={clsx({
                [classes.hide] : !this.state.patternsOpen
              })}
            >
              <ChevronRightIcon />
            </IconButton>
            <div className="content-title" style={{flexGrow:1}}>
            </div>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerOpen}
              className={clsx(this.state.settingsOpen && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
          </div>
          {patternContent}

        <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
          className={classes.drawer}
          variant={ mobile ? undefined : "persistent" }
          open={this.state.patternsOpen}
          onOpen={handlePatternsOpen}
          onClose={handlePatternsClose}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={handlePatternsClose}>
                <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <div className={classes.drawerContainer}>
            <List>
              {(this.state.patterns ?? []).map( (pattern, index) => (
                <ListItem button key={"drawer-pattern" + index.toString()} onClick={() => this.selectPattern(index)}>
                    <ListItemText primary={pattern.name} />
                </ListItem>
              ))}
            </List>
          </div>
        </SwipeableDrawer>
        <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
          className={classes.drawer}
          variant={ mobile ? undefined : "persistent" }
          anchor="right"
          open={this.state.settingsOpen}
          onOpen={handleDrawerOpen}
          onClose={handleDrawerClose}
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={handleDrawerClose}>
                <ChevronRightIcon />
            </IconButton>
          </div>
          <Divider />
          <FormatSettings onChange={settingsChangeCallback} settings={this.state.formatSettings}/>  
        </SwipeableDrawer>
        </React.Fragment>
      );
    }
  }

  render() {
    const classes = this.props;
    const mainContent = this.renderMainContent();
    return (
      <div className="App">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {mainContent}
        </ThemeProvider>
      </div>
    );
  }
}

export default App;
