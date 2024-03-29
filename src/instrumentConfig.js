import React from 'react';
import { makeStyles } from '@mui/styles';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

// table
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import Box from '@mui/material/Box';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddBoxIcon from '@mui/icons-material/AddBox';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DispatchingDialog from "./DispatchingDialog"
import RenameDialog from "./RenameDialog";
import { withStyles } from '@mui/styles';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/styles';
import Grid from '@mui/material/Grid';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClickNHold from 'react-click-n-hold';
import Slider from '@mui/material/Slider';
import Tooltip from "./TabitTooltip";
import AVAILABLE_SAMPLES from "./samples.json";

import {isMobile} from "./Mobile";

const useStyles = makeStyles(() => ({
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
    if( isMobile ){ setActive(false); }
    setVolume(event,value);
  };

  const onMuteChange = () =>
  {
    props.onMuteEvent(!props.muted);
  };

  return (
    <ClickNHold
      time={0.5} // Time to keep pressing. Default is 2
      onClickNHold={isMobile ? holdMobile : holdDesktop}
      onEnd={isMobile ? null : holdEndDesktop} >
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
          { props.muted ?  <VolumeOffIcon fontSize="small" />
          : sliderValue < 10 ? <VolumeMuteIcon fontSize="small" />
          : sliderValue < 50 ? <VolumeDownIcon fontSize="small" />
                             : <VolumeUpIcon fontSize="small"/> }
        </div>
      </InlinableIconButton>
    </ClickNHold>
  );
}

class EditInstrumentSymbolDialog extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
      currentSymbol : null
    };
  }

  render() {

    const cancel = (e) => {
      this.setState({currentSymbol : null});
      if(this.props.onCancel){
        this.props.onCancel();
      }
    };

    const confirm = (e) => {
      if(this.state.currentSymbol !== null && this.state.currentSymbol.length === 1)
      {
        if(this.props.currentSymbol !== this.state.currentSymbol && this.props.onChange){
          this.props.onChange(this.state.currentSymbol);
          this.setState({currentSymbol: null});
        }
      }
      else
      {
        // todo: prettier error communication?
        // note: techincally we've handled the null case already,
        // but belt and braces
        const currentSymbolMsg = this.state.currentSymbol === null ? "" : this.state.currentSymbol;
        alert(
          "You selected an invalid symbol \"" + currentSymbolMsg + "\".\n" +
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
          <Button onClick={confirm} disabled={this.state.currentSymbol === null} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

class EditInstrumentSampleDialog extends React.Component
{
  constructor(props) {
    super(props);
    const drumkitSelections = [...Object.keys(AVAILABLE_SAMPLES) ];
    const selectedDrumkit = props.initialDrumkit !== undefined ? drumkitSelections.indexOf(props.initialDrumkit) : 0;
    const selectedSample = (props.initialDrumkit !== undefined && props.initialSample !== undefined) ?
      [...AVAILABLE_SAMPLES[props.initialDrumkit]].indexOf(props.initialSample) : 0;
    this.state = {
      currentDrumkitIndex : selectedDrumkit,
      currentSampleIndex: selectedSample
    };
  }

  render() {

    const cancel = (e) => {
      if(this.props.onCancel){
        this.props.onCancel();
      }
    };

    const handleDrumkitChange = (e) => {
      if(e.target.value !== this.state.currentDrumkitIndex)
      {
        this.setState({
          currentDrumkitIndex: e.target.value,
          currentSampleIndex: 0
        });
      };
    };

    const handleEnter = (e) =>
    {
      if(e.keyCode === 13)
      {
        e.preventDefault();
        confirm();
      }
    };
    const drumkitSelections = [...Object.keys(AVAILABLE_SAMPLES) ];
    const sampleSelections = [...AVAILABLE_SAMPLES[drumkitSelections[this.state.currentDrumkitIndex]]];


    const confirm = (e) => {
      if(this.state.currentDrumkitIndex !== null && this.state.currentSampleIndex !== null)
      {
        if(this.props.onChange){
          this.props.onChange({
            drumkit: drumkitSelections[this.state.currentDrumkitIndex],
            sample: sampleSelections[this.state.currentSampleIndex]
          });
        }
      }
    };

    return (
      <Dialog open={this.props.open} onClose={cancel} aria-labelledby="form-dialog-title"
        onKeyDown={handleEnter}
      >
        <DialogTitle id="form-dialog-title"></DialogTitle>
        <DialogContent>
          <FormControl variant="standard">
            <InputLabel id="drumkit-label">Drumkit</InputLabel>
            <Select
              labelId="drumkit-select-label"
              id="drumkit-select"
              value={this.state.currentDrumkitIndex}
              onChange={handleDrumkitChange}
              label="Drumkit"
            >
            {drumkitSelections.map( (element,index) => <MenuItem value={index} key={index + "-" + element}> {element} </MenuItem> )}
            </Select>
          </FormControl>
          <FormControl variant="standard">
            <InputLabel id="sample-label">Sample</InputLabel>
            <Select
              labelId="sample-select-label"
              id="sample-select"
              value={this.state.currentSampleIndex}
              onChange={(e)=>{this.setState({currentSampleIndex: e.target.value})}}
              label="Sample"
            >
            {sampleSelections.map( (element,index) => <MenuItem value={index} key={index.toString() + "-" + element}> {element} </MenuItem> )}
            </Select>
          </FormControl>
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

function InstrumentTableBody(props)
{

  // const width = props.instrumentMask.length;
  // const height = props.instruments.length;

  const editRow = (y)=>{ if( props.onEditRow ){ props.onEditRow(y); }};
  const addRow = ()=>{ if( props.onAddRow ){ props.onAddRow(); }};
  const removeRow = (y)=>{ if( props.onRemoveRow ){ props.onRemoveRow(y); }};

  const createCell = (x,y) =>
  {
      return (
        <TableCell
          align="center"
          key={"instrumentPanel-cell-" + y.toString() + "-" + x.toString()}
        >
          <ThinFormControlLabel
            control={<Checkbox checked={props.instrumentMask[x] === y} onChange={(e) =>{props.onInstrumentReassign(x,y,e);}} name={x + "," + y.toString()} />}
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
            <Tooltip
              title="Edit Instrument"
              show={props.showHelp}
            >
              <InlinableIconButton onClick={(e)=>{editRow(y);}}><EditIcon fontSize="small"/></InlinableIconButton>
            </Tooltip>
            <Tooltip
              title="Delete Instrument"
              show={props.showHelp}
            >
              <InlinableIconButton onClick={(e)=>{removeRow(y);}}><ClearIcon fontSize="small"/></InlinableIconButton>
            </Tooltip>
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
          <Tooltip
            title="Add Instrument"
            show={props.showHelp}
          >
            <IconButton onClick={(e)=>{addRow();}} aria-label="add">
              <AddBoxIcon/>
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };
  return (
    <TableBody>
      {[...Array(props.instruments.length).keys()].map(y=>createMatchingRow(y))}
      {createEditRow()}
    </TableBody>
  );
}

function InstrumentTableHeader(props)
{
  return (
    <React.Fragment>
      <TableRow key={"instrumentPanel-row-header"}>
        { (props.showExpandControls || props.showHiddenExpandControls)
         && <NoDividerCenterTableCell key={"instrumentPanel-row-instrument"}></NoDividerCenterTableCell> }
        {[...Array(props.instruments.length).keys()].map(x=>
            <NoDividerCenterTableCell key={"instrumentPanel-row-header-cell-" + x.toString()}>
              <Button onClick={()=>{props.onVolumeEvent({index: x, solo: true});}} color="primary">
                <Typography>{props.instruments[x].name}</Typography>
              </Button>
            </NoDividerCenterTableCell>)}
      </TableRow>
      <TableRow key={"instrumentPanel-row-controls"}>
        {
          props.showHiddenExpandControls && <NoDividerCenterTableCell key={"instrumentPanel-row-instrument"}></NoDividerCenterTableCell>
        }
        { props.showExpandControls &&
          <CenterTableCell key={"instrumentPanel-row-instrument"}>
            <IconButton aria-label="Show Instrument Matcher" size="small" onClick={props.onToggleOpen}>
              {props.expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </CenterTableCell>
        }
        {[...Array(props.instruments.length).keys()].map(x=>
            <CenterTableCell key={"instrumentPanel-row-controls-cell-" + x.toString()}>
              <Grid container>
              <Grid item xs={6}>
              <Tooltip
                title={`Edit ${props.instrumentCategory}`}
                show={props.showHelp}
              >
                <InlinableIconButton onClick={(e)=>{props.onEditInstrument(x);}}>
                  <EditIcon fontSize="small"/>
                </InlinableIconButton>
              </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <VolumeWidget
                  muted={props.instruments[x].muted}
                  onChange={(value)=>{props.onVolumeEvent( {index: x, volume: value / 100.0}); }}
                  onMuteEvent={(muted)=>{props.onVolumeEvent( {index: x, muted: muted})}}
                />
              </Grid>
              </Grid>
            </CenterTableCell>)}
      </TableRow>
    </React.Fragment>
  );
}

function InstrumentTable(props)
{
  const classes = useStyles();

  let [open, setOpen] = React.useState( false );

  const showEditableTableBody = open && props.showAdvanced;

  const createInstrumentComponents = () => {
    return props.instruments.map(element => {return {name: element[0], muted: element[3].muted, volume: element[3].volume}; });
  }

  const headerTracks = props.instrumentIndex;
  const headerInstruments = createInstrumentComponents();
  const onHeaderVolumeEvent = (isTrack, {index, volume, muted, solo}) => {
    const event = isTrack ? {track: index} : {instrument:index};
    props.onVolumeEvent(Object.assign(
      event, 
      {
        muted: muted,
        volume: volume,
        solo: solo
      }
    ));
  };
  /*

  */
  return (
    <React.Fragment>
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <InstrumentTableHeader
          showExpandControls={true}
          expanded={open}
          showHelp={props.showHelp}
          instruments={headerInstruments}
          instrumentCategory="Instrument"
          onEditInstrument={props.onEditRow}
          onToggleOpen={()=>setOpen(!open)}
          onVolumeEvent={(event)=>onHeaderVolumeEvent(false, event)}
        />
      </TableHead>
      <TableBody />
    </Table>
    {open &&
      <Table>
        <TableHead>
          <InstrumentTableHeader
            showExpandControls={false}
            showHiddenExpandControls={true}
            expanded={open}
            showHelp={props.showHelp}
            instruments={headerTracks}
            instrumentCategory="Track"
            onEditInstrument={props.onEditColumn}
            onToggleOpen={()=>setOpen(!open)}
            onVolumeEvent={(event)=>onHeaderVolumeEvent(true, event)}
          />
        </TableHead>
        {showEditableTableBody && <InstrumentTableBody 
          instrumentMask={props.instrumentMask}
          instrumentIndex={props.instrumentIndex}
          instruments={props.instruments}
          showHelp={props.showHelp}
          onInstrumentReassign={props.onInstrumentReassign}
          onEditRow={props.onEditRow}
          onAddRow={props.onAddRow}
          onRemoveRow={props.onRemoveRow}
        />}
        {!showEditableTableBody && <TableBody />}
      </Table>
    }
    </React.Fragment>
  );
}

function InstrumentConfig(props) {
  const theme = useTheme();
  const [editingSymbol, setEditingSymbol] = React.useState(null);
  const [editingSample, setEditingSample] = React.useState(null);
  const [renamingInstrument, setRenamingInstrument] = React.useState(null);
  const [editingInstrument, setEditingInstrument] = React.useState(null);

  const removeInstrument = (y) =>
  {
    props.onChangeRequest({kind: "remove", index: y});
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
      props.onChangeRequest({kind: "symbol", index: editingSymbol, symbol: resolvedSymbol});
    }
    setEditingSymbol( null );
  };

  const endEditingSample = (resolvedSample) =>
  {
    if(resolvedSample !== null)
    {
      let replacedInstrumentIndex = props.instrumentIndex.slice();
      // create a new object
      replacedInstrumentIndex[editingSample] = Object.assign(
        Object.assign( {}, replacedInstrumentIndex[editingSample] ),
        {
          drumkit: resolvedSample.drumkit,
          filename: resolvedSample.sample
        }
      );
      props.onInstrumentIndexChange(replacedInstrumentIndex);
    }
    setEditingSample( null );
  };

  const getName = (y) => {
    return y < props.instruments.length ? props.instruments[y][0] : "";
  };

  const renameInstrument = (instrumentName)  =>
  {
    // this function also deals with the addition of new instruments
    if( renamingInstrument === props.instruments.length )
    {
      props.onChangeRequest({kind: "create", index: renamingInstrument, name: instrumentName});
    }
    else
    {
      props.onChangeRequest({kind: "rename", index: renamingInstrument, name: instrumentName});
    }
    setRenamingInstrument(null);
  };

  const containerStyle = {
    "overflowY": "hidden"
  };
  return (
    <React.Fragment>
      <RenameDialog
        open={renamingInstrument !== null}
        onCancel={()=>{setRenamingInstrument(null);}}
        onChange={(s)=>{renameInstrument(s);}}
        value={renamingInstrument !== null ? getName(renamingInstrument) : ""}
        instruction="Enter instrument name"
      />
      <EditInstrumentSymbolDialog
        open={editingSymbol !== null}
        onCancel={()=>{endEditingSymbol(null);}}
        onChange={(s)=>{endEditingSymbol(s);}}
        value={editingSymbol !== null ? getSymbol(editingSymbol) : ""}
        />
      {editingSample === null ||
        <EditInstrumentSampleDialog
          open={editingSample!== null}
          onCancel={()=>{endEditingSample(null);}}
          onChange={(s)=>{endEditingSample(s);}}
          initialDrumkit={editingSample !== null ? props.instrumentIndex[editingSample].drumkit : undefined}
          initialSample={editingSample !== null ? props.instrumentIndex[editingSample].filename : undefined}
        />
      }
      <DispatchingDialog
        open={editingInstrument !== null}
        onCancel={()=>setEditingInstrument(null)}
        title={editingInstrument !== null ? "Edit " + props.instrumentIndex[editingInstrument].name : null}
      >
        <Button onClick={()=>{setEditingSymbol(editingInstrument);setEditingInstrument(null);}}>
          Edit Symbol
        </Button>
        <Button onClick={()=>{setEditingSample(editingInstrument);setEditingInstrument(null);}}>
          Edit Sample
        </Button>
      </DispatchingDialog>
      <Box style={{"paddingBottom" : theme.spacing(1)}}>
        <TableContainer component={Paper} style={containerStyle}>
          <InstrumentTable
            instrumentIndex={props.instrumentIndex}
            instrumentMask={props.instrumentMask}
            instruments={props.instruments}
            onEditColumn={(x)=>setEditingInstrument(x)}
            onEditRow={(y)=>{setRenamingInstrument(y);}}
            onAddRow={()=>{setRenamingInstrument(props.instruments.length)}}
            onRemoveRow={(y)=>{removeInstrument(y);}}
            onVolumeEvent={props.onVolumeEvent}
            onChangeRequest={props.onChangeRequest}
            onInstrumentReassign={props.onInstrumentReassign}
            showAdvanced={props.showAdvanced}
            showHelp={props.showHelp}
          />
        </TableContainer>
      </Box>
    </React.Fragment>
  );
}

export default React.memo( InstrumentConfig );
