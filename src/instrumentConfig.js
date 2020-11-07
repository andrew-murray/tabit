import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

// table
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import AddBoxIcon from '@material-ui/icons/AddBox';
import EditIcon from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import Grid from '@material-ui/core/Grid';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
import VolumeDownIcon from '@material-ui/icons/VolumeDown';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import ClickNHold from 'react-click-n-hold';
import Slider from '@material-ui/core/Slider';

import {isMobile} from "./Mobile";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  }
}));

const ThinFormControlLabel = withStyles({
  root: {
    marginLeft: 0,
    marginRight: 0
  }
})(FormControlLabel);

const InlinableIconButton = withStyles({
  root: {
    padding: 2
  }
})(IconButton);

const NoDividerCenterTableCell = withStyles((theme) => ({
  root: {
    borderBottom: "none",
    textAlign: "center",
    paddingBottom: theme.spacing(0) // make instrument titles bunch up with their controls a little more
  }
}))(TableCell);

const CenterTableCell = withStyles((theme) => ({
  root: {
    textAlign: "center"
  }
}))(TableCell);

function VolumeWidget(props)
{
  const [active, setActive] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState(100);
  const [muted, setMuted] = React.useState(props.muted);
  const sliderRef = React.useRef(null);
  const height = props.height ? props.height / 3 : 24;
  const FixedHeightStylings = {
    height: 3*height,
    position: "absolute",
    top: -height
  };
  const SliderStyles = Object.assign(active? {} : {"visibility": "hidden", paddingLeft: "0px"}, FixedHeightStylings);
  const IconStyles = active ?  {"visibility":"hidden"} : {};

  // currently: updating based on the normal volume event isn't nearly performant enough 
  // (because the app's state update is really sluggish)
  // potential fixes - seperate the audio and the visual state and/or create smaller state objects
  const setVolume = (event, value) =>
  {
    setSliderValue(value);
    if( props.onChange )
    {
      props.onChange( value );
    }
  };

  // for mobile
  // we click'n'hold which opens the volume slider, but don't propagate focus
  
  // for desktop/tablet
  // we click'n'hold and propagate focus to the slider, so that our drag 
  // will pull the slider up and down
  const mobile = isMobile();

  const holdDesktop = (start, event)=>{
    if(!active){ setActive(true); }
    if(sliderRef){ sliderRef.current.dispatchEvent(event.nativeEvent);}
  };

  const holdMobile= (start, event)=>{
    if(!active){ setActive(true); }
  };

  const holdEndDesktop = (e)=>{
    setActive(false);
  };

  const commitVolume = (event,value)=>
  {
    if( mobile ){ setActive(false); }
    setVolume(event,value);
  };

  const onMuteChange = () =>
  {
    setMuted(!muted);
    props.onMuteEvent(!muted);
  };

  return (
    <ClickNHold
      time={0.5} // Time to keep pressing. Default is 2
      onClickNHold={mobile ? holdMobile : holdDesktop}
      onEnd={mobile ? null : holdEndDesktop} >
      <InlinableIconButton disableRipple disableFocusRipple onClick={onMuteChange} >
        <div style={SliderStyles}>
          <Slider
            defaultValue={100}
            orientation="vertical"
            aria-labelledby="vertical-slider"
            onChange={commitVolume}
            ref={sliderRef}
          />
        </div>
        <div style={IconStyles}>
          { muted ?  <VolumeOffIcon fontSize="small" />
          : sliderValue < 10 ? <VolumeMuteIcon fontSize="small" />
          : sliderValue < 50 ? <VolumeDownIcon fontSize="small" />
                             : <VolumeUpIcon fontSize="small"/> }
        </div>
      </InlinableIconButton>
    </ClickNHold>
  );
}

class RawInstrumentEditDialog extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      currentSymbol : null
    };
  }

  render() {

    const cancel = (e) => {
      this.setState({"currentSymbol" : null});
      if(this.props.onCancel){
        this.props.onCancel();
      }
    };

    const confirm = (e) => {
      if(this.state.currentSymbol !== null && this.state.currentSymbol.length === 1)
      {
        if(this.props.onChange){
          this.props.onChange(this.state.currentSymbol);
        }
      }
      else
      {
        // todo: prettier error communication?
        alert(
          "You selected an invalid symbol \"" + this.state.currentSymbol + "\".\n" +
          "Symbols must be precisely 1 character."
        );
      }
    };

    const handleEnter = (e) =>
    {
      if(e.keyCode === 13)
      {
        e.preventDefault();
        confirm();
      }
    };

    return (
      <Dialog open={this.props.open} onClose={cancel} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title"></DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter notation symbol
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            fullWidth
            value={this.state.currentSymbol ?? this.props.value}
            onChange={(e)=>{this.setState({currentSymbol: e.target.value});}}
            onKeyDown={handleEnter}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel} color="primary">
            Cancel
          </Button>
          <Button onClick={confirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

class InstrumentRenameDialog extends React.Component
{
  constructor(props)
  {
    super(props)
    this.state = {
      currentName : null
    };
  }

  render()
  {

    const cancel = () => {
      if(this.props.onCancel)
      {
        this.props.onCancel();
      }
      this.setState({currentName: null});
    };

    const confirm = () => {
      if(this.state.currentName !== null)
      {
        const instrumentName = this.state.currentName.trim();
        if( instrumentName.length > 0 )
        {
          if(this.props.onChange)
          {
            this.props.onChange(this.state.currentName);
          }
          this.setState({currentName: null});
        }
        else
        {
          // todo: prettier error communication?
          alert(
            "You selected an invalid instrument name \"" + this.state.currentName + "\".\n" +
            "Must be non-empty."
          );
        }
      }
      else
      {
        cancel();
      }
    };

    const handleEnter = (e) =>
    {
      if(e.keyCode === 13)
      {
        e.preventDefault();
        confirm();
      }
    };

    return (
      <Dialog open={this.props.open} onClose={cancel} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title"></DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter instrument name
          </DialogContentText>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            value={this.state.currentName ?? this.props.value}
            onChange={(e)=>{this.setState({currentName: e.target.value});}}
            onKeyDown={handleEnter}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel} color="primary">
            Cancel
          </Button>
          <Button onClick={confirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
};

function InstrumentTable(props)
{
  const classes = useStyles();

  const editRow = (y)=>{ if( props.onEditRow ){ props.onEditRow(y); }};
  const editColumn = (x)=>{ if( props.onEditColumn ){ props.onEditColumn(x); }};
  const addRow = ()=>{ if( props.onAddRow ){ props.onAddRow(); }};
  const removeRow = (y)=>{ if( props.onRemoveRow ){ props.onRemoveRow(y); }};

  const handleChange = (x,y, event) => {
    const instrumentID = props.instrumentIndex[x].id;
    const oldInstrumentIndex = props.instruments.findIndex( instrument => instrumentID in instrument[1]);
    const dstInstrumentIndex = y;
    if( oldInstrumentIndex === dstInstrumentIndex )
    {
      return;
    }
    const oldInstrument = props.instruments[oldInstrumentIndex];
    let replacedSrcInstrument = [
      "",
      {}
    ];
    if( oldInstrument != null )
    {
      replacedSrcInstrument[0] = oldInstrument[0];
      for( const key of Object.keys(oldInstrument[1]) )
      {
        if( key !== instrumentID.toString() )
        {
          replacedSrcInstrument[1][key] = oldInstrument[1][key];
        }
      }
    }
    let dstInstrument = [
      props.instruments[dstInstrumentIndex][0],
      Object.assign({}, props.instruments[dstInstrumentIndex][1] )
    ];
    if(oldInstrument != null )
    {
      dstInstrument[1][instrumentID.toString()] = oldInstrument[1][instrumentID];
    }
    else
    {
      dstInstrument[1][instrumentID.toString()] = "X";
    }

    let replacedInstruments = [];

    for(let instrumentIndex = 0; instrumentIndex < props.instruments.length; ++instrumentIndex)
    {
      if( instrumentIndex === oldInstrumentIndex )
      {
        replacedInstruments.push( replacedSrcInstrument );
      }
      else if( instrumentIndex === dstInstrumentIndex )
      {
        replacedInstruments.push( dstInstrument )
      }
      else
      {
        replacedInstruments.push( props.instruments[instrumentIndex] );
      }
    }
    props.onChange(replacedInstruments);
  };

  const createCell = (x,y) =>
  {
      return ( 
        <TableCell
          align="center"
          key={"instrumentPanel-cell-" + y.toString() + "-" + x.toString()}
        >
        <ThinFormControlLabel
          control={<Checkbox checked={props.instrumentMask[x] === y} onChange={(e) =>{handleChange(x,y,e);}} name={x + "," + y.toString()} />}
        />
        </TableCell>
      );
  }

  const createMatchingRow = (y) =>
  {
    return (
      <TableRow key={"instrumentPanel-row-" + y.toString()}>
        <TableCell component="th" scope="row" key={"instrumentPanel-row-" + y.toString() + "-name"}> 
          <Typography>{props.instruments[y][0]}</Typography>
          <InlinableIconButton onClick={(e)=>{editRow(y);}}><EditIcon fontSize="small"/></InlinableIconButton>
          <InlinableIconButton onClick={(e)=>{removeRow(y);}}><ClearIcon fontSize="small"/></InlinableIconButton>
        </TableCell>
        {[...Array(props.instrumentMask.length).keys()].map(x=>createCell(x,y))}
      </TableRow>
    );
  };

  const createEditRow = () =>
  {
    return (
      <TableRow key={"instrumentPanel-row-edit"}>
        <TableCell component="th" scope="row" key={"instrumentPanel-row-edit-cell"}>
          <IconButton onClick={(e)=>{addRow();}} aria-label="add">
            <AddBoxIcon/>
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow key={"instrumentPanel-row-header"}>
          <NoDividerCenterTableCell key={"instrumentPanel-row-instrument"}> Instrument </NoDividerCenterTableCell>
          {[...Array(props.instrumentIndex.length).keys()].map(x=>
              <NoDividerCenterTableCell key={"instrumentPanel-row-header-cell-" + x.toString()}>
                <Typography>{props.instrumentIndex[x].name}</Typography>
              </NoDividerCenterTableCell>)}
        </TableRow>
        <TableRow key={"instrumentPanel-row-controls"}>
          <TableCell key={"instrumentPanel-row-instrument"}></TableCell>
          {[...Array(props.instrumentIndex.length).keys()].map(x=>
              <CenterTableCell key={"instrumentPanel-row-controls-cell-" + x.toString()}>
                <Grid container>
                <Grid item xs={6}>
                <InlinableIconButton onClick={(e)=>{editColumn(x);}}>
                  <EditIcon fontSize="small"/>
                </InlinableIconButton>
                </Grid>
                <Grid item xs={6}>
                  <VolumeWidget
                    muted={props.instrumentIndex[x].muted}
                    onChange={(value)=>{props.onVolumeEvent( {instrument: x, volume: value / 100.0}); }}
                    onMuteEvent={(muted)=>{props.onVolumeEvent( {instrument: x, muted: muted})}}
                    />
                </Grid>
                </Grid>
              </CenterTableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(props.instruments.length).keys()].map(y=>createMatchingRow(y))}
        {createEditRow()}
      </TableBody>
    </Table>
  );
}

function InstrumentConfig(props) {
  const [editingSymbol, setEditingSymbol] = React.useState(null);
  const [renamingInstrument, setRenamingInstrument] = React.useState(null);

  const removeInstrument = (y) =>
  {
    let replacedInstruments = props.instruments.slice(0,y).concat(props.instruments.slice(y+1));
    props.onChange(replacedInstruments);
  };

  const getSymbol = (x) => {
    const instrumentID = props.instrumentIndex[editingSymbol].id;
    const instrumentIndex = props.instruments.findIndex( instrument => instrumentID in instrument[1]);
    return props.instruments[instrumentIndex][1][instrumentID];
  };

  const endEditingSymbol = (resolvedSymbol) =>
  {
    if(resolvedSymbol !== null)
    {
      const instrumentID = props.instrumentIndex[editingSymbol].id;
      const instrumentIndex = props.instruments.findIndex( instrument => instrumentID in instrument[1]);
      let replacedInstruments = Array.from(props.instruments);
      replacedInstruments[instrumentIndex][1][instrumentID] = resolvedSymbol;
      props.onChange(replacedInstruments);
    }
    setEditingSymbol( null );
  };

  const getName = (y) => {
    return y < props.instruments.length ? props.instruments[y][0] : "";
  };

  const renameInstrument = (instrumentName)  =>
  {
    // this function also deals with the addition of new instruments
    if( renamingInstrument === props.instruments.length )
    {
      const extraInstrument = [ instrumentName, {} ];
      let replacedInstruments = Array.from( props.instruments );
      replacedInstruments.push(extraInstrument);
      props.onChange(replacedInstruments);
    }
    else
    {
      let replacedInstruments = Array.from( props.instruments );
      replacedInstruments[renamingInstrument][0] = instrumentName;
      props.onChange(replacedInstruments);
    }
    setRenamingInstrument(null);
  };

  const containerStyle = {
    "border": "2px solid rgba(255, 255, 255, 0.5)",
    "outline": "none",
    "borderRadius": "8px"
  };
  return (
    <div style={{"paddingBottom" : "5px"}}>
      <InstrumentRenameDialog
        open={renamingInstrument !== null}
        onCancel={()=>{setRenamingInstrument(null);}}
        onChange={(s)=>{renameInstrument(s);}}
        value={renamingInstrument !== null ? getName(renamingInstrument) : ""}
      />
      <RawInstrumentEditDialog
        open={editingSymbol !== null}
        onCancel={()=>{endEditingSymbol(null);}}
        onChange={(s)=>{endEditingSymbol(s);}}
        value={editingSymbol !== null ? getSymbol(editingSymbol) : ""}
        />
      <TableContainer style={containerStyle}>
        <InstrumentTable
          instrumentIndex={props.instrumentIndex}
          instrumentMask={props.instrumentMask}
          instruments={props.instruments}
          onEditColumn={(x)=>{setEditingSymbol(x);}}
          onEditRow={(y)=>{setRenamingInstrument(y);}}
          onAddRow={()=>{setRenamingInstrument(props.instruments.length)}}
          onRemoveRow={(y)=>{removeInstrument(y);}}
          onVolumeEvent={props.onVolumeEvent}
          onChange={props.onChange}
        />
      </TableContainer>
    </div>
  );
}

function createInstrumentMask(instrumentIndex, instruments)
{
  let instrumentMask = Array(instrumentIndex.length);
  for( let baseInstrumentIndex = 0; baseInstrumentIndex < instrumentIndex.length; ++baseInstrumentIndex )
  {
    const baseInstrumentId = instrumentIndex[baseInstrumentIndex].id;
    for( let targetInstrumentIndex = 0; targetInstrumentIndex < instruments.length; ++targetInstrumentIndex)
    {
      const target = instruments[targetInstrumentIndex];
      if(baseInstrumentId.toString() in target[1])
      {
        instrumentMask[baseInstrumentIndex] = targetInstrumentIndex;
      }
    }
  }
  return instrumentMask;
}

export { createInstrumentMask, InstrumentConfig };