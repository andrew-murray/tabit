import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import Divider from "@material-ui/core/Divider";

import notation from "./notation";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));

function camelToReadable(s)
{
  const spacedString = s.replace(/([A-Z])/g, ' $1');
  return spacedString[0].toUpperCase() + spacedString.slice(1);
}

function generateDivisibleNumbers(trackLength, beatResolution)
{
  let options = [];
  for( let beatTotal = beatResolution * 2; beatTotal <= trackLength; beatTotal += beatResolution )
  {
    if( ( trackLength % beatTotal ) === 0)
    {
      options.push( beatTotal );
    }
  }
  return options;
}

function FormatSettings(props) {
  const classes = useStyles(props);
  const theme = useTheme();
  // todo: change to multiple useState calls?

  function tokenStateToItem(value)
  {
    return value === " " ? "space" : value;
  }

  function tokenItemToState(value)
  {
    return value === "space" ? " " : value;
  }

  const handleOptionChange = (name, value) => {
    const updatedState = {...props.settings, [name]: value};
    props.onChange(updatedState);
  };

  const handleCheckedChange = (event) => {
    const updatedState = {...props.settings, [event.target.name]: event.target.checked};
    props.onChange(updatedState);
  };

  function createOptionMenu(
    name,
    options,
    itemToState = tokenItemToState,
    stateToItem = tokenStateToItem
  )
  {
    const idString = "form-control-" + name + "-id";
    return (
      <FormControl variant="filled" className={classes.formControl} key={idString} id={idString}>
        <InputLabel id="settings-option-{name}">{name}</InputLabel>
        <Select
          labelId={"settings-option-" + name + "-labelID"}
          id={"settings-option-" + name + "-id"}
          value={stateToItem(props.settings[name])}
          name={name}
          onChange={(e) => handleOptionChange( e.target.name, itemToState(e.target.value))}
        >
          {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={stateToItem(op)}>{stateToItem(op)}</MenuItem>)}
        </Select>
      </FormControl>
    );
  };

  function createBoolControl(name)
  {
    return (
      <FormControlLabel
        control={<Switch checked={props.settings[name]} onChange={handleCheckedChange} name={name} />}
        label={camelToReadable(name)}
        key={"switch-"+name}
      />
    );
  };

  const resolutionToBeatString = (r) => ( r / props.settings.beatResolution ).toString();
  const beatStringToResolution = (b) => props.settings.beatResolution * parseInt(b);
  console.log(classes);
  console.dir(classes);
  // divisible is quite clunky, let's be more restrictive
  // const lineLengths = generateDivisibleNumbers(props.trackLength, props.settings.beatResolution);
  const candidateLineLengths = [ 2, 3, 4, 5, 6, 7, 8 ];
  let lineLengths = [];
  for( const c of candidateLineLengths )
  {
    const resolution = c * 48;
    if( (resolution % props.settings.beatResolution) === 0 )
    {
      lineLengths.push( resolution );
    }
    // we permit one-over, in case that's useful for an "uneven" pattern
    if(resolution > props.settings.length)
    {
      break;
    }
  }

  const candidateBeatResolutions = [24, 48, 96];
  let beatResolutions = [];
  for( const c of candidateBeatResolutions )
  {
    if( (c % props.pattern.resolution) === 0 )
    {
      beatResolutions.push( c );
    }
  }
  return (
    <FormGroup className={classes.root}>
      {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ).reduce((prev, curr) => [prev, curr])}
      {notation.FORMAT_CONFIG_BOOLS.map( op => createBoolControl( op )).reduce((prev, curr) => [prev, curr]) }
      <div style={{backgroundColor : "white", color : theme.palette.background.default}}><p> {props.pattern.name + " Options"} </p></div>
      {
        createOptionMenu(
          "beatResolution",
          beatResolutions,
          (v) => v.toString(), // stateToItem
          (v) => parseInt(v) // itemToState
        )
      }
      {createOptionMenu(
        "lineResolution",
        lineLengths,
        beatStringToResolution,
        resolutionToBeatString
      )}
    </FormGroup>
  );
}

const DefaultSettings = notation.DEFAULT_FORMAT_CONFIG; 


export { FormatSettings, DefaultSettings }
export default FormatSettings;