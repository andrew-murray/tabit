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

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  formControl: {
    margin: theme.spacing(1),
  }
}));

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

  const createCell = (x,y) =>
  {
      return ( 
        <TableCell>
        <FormControlLabel
          control={<Checkbox checked={props.instrumentMask[x] === y} onChange={(e) => handleChange(x,y,e)} name={x + "," + y.toString()} />}
        />
        </TableCell>
      );

  }

  const createMatchingRow = (y) =>
  {
    return (
      <TableRow>
        <TableCell component="th" scope="row">{props.instruments[y][0]}</TableCell>
        {[...Array(props.instrumentIndex.length).keys()].map(x=>createCell(x,y))}
      </TableRow>
    );
  };

  return (
    <TableContainer>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell> Instrument </TableCell>
            {[...Array(props.instrumentIndex.length).keys()].map(x=><TableCell>{props.instrumentIndex[x].name}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(props.instruments.length).keys()].map(y=>createMatchingRow(y))}
        </TableBody>
      </Table>
    </TableContainer>
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