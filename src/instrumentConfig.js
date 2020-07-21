import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  formControl: {
    margin: theme.spacing(1),
  },
}));

export default function InstrumentConfig(props) {
  const classes = useStyles();

  const currentInstruments = 3;
  const currentTracks = props.instruments.length;

  let instrumentMask = [];

  for( let i = 0; i < currentInstruments; ++i )
  {
    instrumentMask.push(Array(currentTracks).fill(0));
  }

  const [state, setState] = React.useState({
    instrumentMask : instrumentMask,
    instrumentNames: ["djembe", "bass", "snare"]
  });

  const handleChange = (event) => {
    let gridCopy = Array.from(state.instrumentMask);
    
    gridCopy()
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  const createLabel = (x,y) => {
    return( <FormControlLabel
      control={<Checkbox checked={state.instrumentMask[y][x]} onChange={handleChange} name={x.toString() + "," + y.toString()} />}
    />
    );
  };

  const createColumn = (title, trackIndex) => {    
    return (
        <FormControl component="fieldset" className={classes.formControl} key={"track-form-" + title}>
          <FormLabel component="legend">{title}</FormLabel>
          <FormGroup>
            {[...Array(state.instrumentNames.length).keys()].map(y => createLabel(trackIndex,y))}
          </FormGroup>
        </FormControl>
    );
  };
  
  return (
    <FormGroup className={classes.root} row>
      {[...Array(props.instruments.length).keys()].map(x=>createColumn(props.instruments[x].name, x))}
    </FormGroup>
  );
}

