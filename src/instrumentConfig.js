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
import VolumeUpIcon from '@material-ui/icons/VolumeUp';

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

function InstrumentConfig(props) {
  const classes = useStyles();

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

  const removeInstrument = (y) => 
  {
    let replacedInstruments = props.instruments.slice(0,y).concat(props.instruments.slice(y+1));
    props.onChange(replacedInstruments);
  };

  const [renamingInstrument, setRenamingInstrument] = React.useState(-1);
  let [nameState, setNameState] = React.useState("");

  const createCell = (x,y) =>
  {
      return ( 
        <TableCell
          align="center"
          key={"instrumentPanel-cell-" + y.toString() + "-" + x.toString()}
        >
        <ThinFormControlLabel
          control={<Checkbox checked={props.instrumentMask[x] === y} onChange={(e) => handleChange(x,y,e)} name={x + "," + y.toString()} />}
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
          <InlinableIconButton onClick={(e)=>setRenamingInstrument(y)}><EditIcon fontSize="small"/></InlinableIconButton>
          <InlinableIconButton onClick={(e)=>{removeInstrument(y);}}><ClearIcon fontSize="small"/></InlinableIconButton>
        </TableCell>
        {[...Array(props.instrumentIndex.length).keys()].map(x=>createCell(x,y))}
      </TableRow>
    );
  };

  const createEditRow = () =>
  {
    return (
      <TableRow key={"instrumentPanel-row-edit"}>
        <TableCell component="th" scope="row" key={"instrumentPanel-row-edit-cell"}>
          <IconButton onClick={(e)=>setRenamingInstrument(props.instruments.length)} aria-label="add">
            <AddBoxIcon/>
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  const renameInstrument = (e)  => 
  {
    const instrumentName = nameState.trim();
    if( instrumentName.length > 0 )
    {
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
    }
    // we just ignore empty string
    setRenamingInstrument(-1);
    setNameState("");
  };

  // todo: The text field is very slow
  // that could be because the dialog and the table content are all one component
  // I should try and fix that first
  // otherwise, it's just that shoving react in the middle is too slow

  const [editSymbol, setEditSymbol] = React.useState(-1);
  let [editSymbolState, setEditSymbolState] = React.useState("");

  const startEditingSymbol = (x) =>
  {
    const instrumentID = props.instrumentIndex[x].id;
    const instrumentIndex = props.instruments.findIndex( instrument => instrumentID in instrument[1]);
    const currentSymbol = props.instruments[instrumentIndex][1][instrumentID];
    setEditSymbolState(currentSymbol);
    setEditSymbol(x);
  };

  const changeSymbol = (e) =>
  {
    const updatedSymbol = editSymbolState;
    if(updatedSymbol.length===1)
    {
      const instrumentID = props.instrumentIndex[editSymbol].id;
      const instrumentIndex = props.instruments.findIndex( instrument => instrumentID in instrument[1]);
      let replacedInstruments = Array.from(props.instruments);
      replacedInstruments[instrumentIndex][1][instrumentID] = editSymbolState;
      props.onChange(replacedInstruments);
    }
    else
    {
      // todo: prettier error communication?
      alert(
        "You selected an invalid symbol \"" + updatedSymbol + "\".\n" + 
        "Symbols must be precisely 1 character."
      );
    }
    setEditSymbol(-1);
  };

  return (
    <React.Fragment>
      <Dialog open={renamingInstrument >= 0} onClose={(e)=>setRenamingInstrument(-1)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title"></DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter instrument name
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            fullWidth
            value={nameState}
            onChange={(e)=>setNameState(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={(e)=>setRenamingInstrument(-1)} color="primary">
            Cancel
          </Button>
          <Button onClick={renameInstrument} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editSymbol >= 0} onClose={(e)=>setEditSymbol(-1)} aria-labelledby="form-dialog-title">
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
            value={editSymbolState}
            onChange={(e)=>setEditSymbolState(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={(e)=>setEditSymbol(-1)} color="primary">
            Cancel
          </Button>
          <Button onClick={changeSymbol} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <TableContainer>
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
                    <InlinableIconButton onClick={(e)=>startEditingSymbol(x)}>
                      <EditIcon fontSize="small"/>
                    </InlinableIconButton>
                    </Grid>
                    <Grid item xs={6}>
                    <InlinableIconButton onClick={(e)=>{
                      props.onVolumeEvent( {instrument: x, muted: !props.instrumentIndex[x].muted} );
                    }}>
                      {
                        props.instrumentIndex[x].muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small"/>
                      }
                    </InlinableIconButton>
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
      </TableContainer>
    </React.Fragment>
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