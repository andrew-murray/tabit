import React from 'react';
import FormControl from '@mui/material/FormControl';

import Paper from '@mui/material/Paper';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TableContainer from '@mui/material/TableContainer';

import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DispatchingDialog from "./DispatchingDialog"
import RenameDialog from "./RenameDialog";
import { useTheme } from '@mui/styles';
import AVAILABLE_SAMPLES from "./samples.json";
import InstrumentTable from "./InstrumentTable";

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
