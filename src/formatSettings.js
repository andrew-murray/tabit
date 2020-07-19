import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
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

function FormatSettings(props) {
  const classes = useStyles();
  // todo: change to multiple useState calls?

  function stateToItem(value)
  {
    return value === " " ? "space" : value;
  }

  function itemToState(value)
  {
    return value === "space" ? " " : value;
  }

  const handleOptionChange = (event) => {
    const updatedState = {...props.settings, [event.target.name]: itemToState(event.target.value)};
    props.onChange(updatedState);
  };

  const handleCheckedChange = (event) => {
    const updatedState = {...props.settings, [event.target.name]: event.target.checked};
    props.onChange(updatedState);
  };

  function createOptionMenu(name, options)
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
          onChange={handleOptionChange}
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

  return (
    <FormGroup className={classes.root}>
      {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ).reduce((prev, curr) => [prev, <Divider/>, curr])}
      <Divider/>
      {notation.FORMAT_CONFIG_BOOLS.map( op => createBoolControl( op )).reduce((prev, curr) => [prev, <Divider/>, curr]) }
    </FormGroup>
  );
}

const DefaultSettings = notation.DEFAULT_FORMAT_CONFIG; 


export { FormatSettings, DefaultSettings }
export default FormatSettings;