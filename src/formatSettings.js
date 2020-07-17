import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
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


export default function SimpleSelect() {
  const classes = useStyles();
  // todo: change to multiple useState calls?
  let [state, setState] = React.useState(notation.DEFAULT_FORMAT_CONFIG);

  function itemText(value)
  {
    return value === " " ? "space" : value;
  }

  function createOptionMenu(name, options)
  {
    const callback = (event) => {
      let stateUpdate = Object.assign( {}, state );
      stateUpdate[name] = event.target.value;
      setState(stateUpdate);
    };
    const idString = "form-control-" + name + "-id";
    return (
      <FormControl variant="filled" className={classes.formControl} key={idString} id={idString}>
        <InputLabel id="settings-option-{name}">{name}</InputLabel>
        <Select
          labelId={"settings-option-" + name + "-labelID"}
          id={"settings-option-" + name + "-id"}
          value={state[name]}
          onChange={callback}
        >
          {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={itemText(op)}>{itemText(op)}</MenuItem>)}
        </Select>
      </FormControl>
    );
  };
  return (
    <div className={classes.root}>
      {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ) }
    </div>
  );
}