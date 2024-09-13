import React from 'react';
import Button from '@mui/material/Button';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { makeStyles, withStyles } from '@mui/styles';
import Tooltip from "./TabitTooltip";
import VolumeWidget from "./VolumeWidget";

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
  }
}));

const InlinableIconButton = withStyles({
  root: {
    padding: 2
  }
})(IconButton);

const ThinFormControlLabel = withStyles({
  root: {
    marginLeft: 0,
    marginRight: 0
  }
})(FormControlLabel);

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

export default function InstrumentTable(props)
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