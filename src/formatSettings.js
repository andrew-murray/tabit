import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';

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

export default function SimpleSelect() {
  const classes = useStyles();
  // todo: change to multiple useState calls?
  let [state, setState] = React.useState(notation.DEFAULT_FORMAT_CONFIG);

  function itemText(value)
  {
    return value === " " ? "space" : value;
  }

  const handleOptionChange = (event) => {
    setState({...state, [event.target.name]: event.target.value});
  };

  const handleCheckedChange = (event) => {
    setState({...state, [event.target.name]: event.target.checked});
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
          value={state[name]}
          name={name}
          onChange={handleOptionChange}
        >
          {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={itemText(op)}>{itemText(op)}</MenuItem>)}
        </Select>
      </FormControl>
    );
  };

  function createBoolControl(name)
  {
    return (
      <FormControlLabel
        control={<Switch checked={state[name]} onChange={handleCheckedChange} name={name} />}
        label={camelToReadable(name)}
        key={"switch-"+name}
      />
    );
  };

  return (
    <FormGroup row className={classes.root}>
      {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ) }
      {notation.FORMAT_CONFIG_BOOLS.map( op => createBoolControl( op )) }
    </FormGroup>
  );
}