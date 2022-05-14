import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListSubheader from '@material-ui/core/ListSubheader';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import notation from "./notation";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  }
}));

function camelToReadable(s)
{
  const spacedString = s.replace(/([A-Z])/g, ' $1');
  return spacedString[0].toUpperCase() + spacedString.slice(1);
}

function FormatSettings(props) {
  const classes = useStyles(props);
  // todo: change to multiple useState calls?

  function tokenStateToItem(value)
  {
    return value === " " ? "space" : value;
  }

  function tokenItemToState(value)
  {
    return value === "space" ? " " : value;
  }

  // currently the only options which are pattern-local
  // are supported by handleOptionChange

  const handleOptionChange = (name, value, local) => {
    // const updatedState = {...props.settings, [name]: value};
    props.onChange({key: name, value: value, local: local});
  };

  const handleCheckedChange = (name, value, local) => {
    // const updatedState = {...props.settings, [event.target.name]: event.target.checked};
    props.onChange({key: name, value: value, local: local});
  };

  function createOptionMenu(
    name,
    options,
    itemToState = tokenItemToState,
    stateToItem = tokenStateToItem,
    localSetting = false
  )
  {
    const idString = "form-control-" + name + "-id";
    return (
      <ListItem variant="filled" className={classes.formControl} key={idString} id={idString} style={{width:"75%"}}>
        <FormControl style={{width:"100%"}}>
          <InputLabel id="settings-option-{name}">{name}</InputLabel>
          <Select
            labelId={"settings-option-" + name + "-labelID"}
            id={"settings-option-" + name + "-id"}
            value={stateToItem(props.settings[name])}
            name={name}
            onChange={(e) => handleOptionChange( e.target.name, itemToState(e.target.value), localSetting)}
            style={{width:"75%", textAlign: "center"}}
          >
            {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={stateToItem(op)} style={{textAlign: "center"}}>{stateToItem(op)}</MenuItem>)}
          </Select>
        </FormControl>
      </ListItem>
    );
  };

  function createBoolControl(name, local, settingsName)
  {
    const sName = settingsName ? settingsName : name;
    return (
      <ListItem key={"form-control-" + name}>
        <FormControlLabel
          control={<Switch
            checked={props.settings[sName]}
            onChange={(e) => handleCheckedChange(e.target.name, e.target.checked, local)}
            name={sName}
          />}
          label={camelToReadable(name)}
          key={"switch-"+name}
        />
      </ListItem>
    );
  };

  const resolutionToBeatString = (r) => ( r / props.settings.beatResolution ).toString();
  const beatStringToResolution = (b) => props.settings.beatResolution * parseInt(b);

  const candidateLineLengths = [ 2, 3, 4, 5, 6, 7, 8, 14, 16, 32 ];
  let lineLengths = [];
  for( const c of candidateLineLengths )
  {
    const resolution = c * 48;
    if( (resolution % props.settings.beatResolution) === 0
      && (resolution <= props.pattern.length)
     )
    {
      lineLengths.push( resolution );
    }
  }

  if( !lineLengths.includes( props.pattern.length ) )
  {
    lineLengths.push( props.pattern.length );
    lineLengths.sort((a, b)=>{return a-b});
  }

  const candidateBeatResolutions = [24, 36, 48, 72, 96];
  let beatResolutions = [];
  for( const c of candidateBeatResolutions )
  {
    if( (c % props.pattern.resolution) === 0 && ( props.settings.lineResolution % c ) === 0)
    {
      beatResolutions.push( c );
    }
  }

  const candidatePrimaryResolutions = [8, 12, 16, 24, 36, 48];
  let primaryResolutions = [];
  for( const c of candidatePrimaryResolutions )
  {
    if( ( (c % props.pattern.resolution) === 0 || (props.pattern.resolution % c) === 0 ) && ( props.settings.lineResolution % c ) === 0)
    {
      primaryResolutions.push( c );
    }
  }


  function instrumentResolutionMenu(
    instSetting,
    options
  )
  {
    const name = instSetting.name;
    const idString = "form-control-" + name + "-resolution-id";
    const updateInstrumentResolutions = (e) => {
      let changedResolutions = props.settings["individualResolutions"].slice();
      changedResolutions[instSetting.index] = {
        index: instSetting.index,
        name: instSetting.name,
        resolution: e.target.value
      };
      props.onChange( {key: "individualResolutions", value:changedResolutions, local: true} );
    }
    return (
      <ListItem variant="filled" className={classes.formControl} key={idString} id={idString} style={{width:"75%"}}>
        <FormControl style={{width:"100%"}}>
          <InputLabel id="settings-option-{name}">{name} resolution</InputLabel>
          <Select
            labelId={"resolution-option-" + name + "-labelID"}
            id={"resolution-option-" + name + "-id"}
            value={props.settings["individualResolutions"][instSetting.index].resolution}
            name={name}
            onChange={updateInstrumentResolutions}
            style={{width:"75%", textAlign: "center"}}
          >
            {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={op} style={{textAlign: "center"}}>{op}</MenuItem>)}
          </Select>
        </FormControl>
      </ListItem>
    );
  };
  return (
    <FormGroup className={classes.root}>
      <List>
        {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ).reduce((prev, curr) => [prev, curr])}
        {notation.FORMAT_CONFIG_BOOLS.map( op => createBoolControl( op, false )).reduce((prev, curr) => [prev, curr]) }
          <ListSubheader>{"Pattern " + props.pattern.name + " Options"} </ListSubheader>
          {
            createOptionMenu(
              "beatResolution",
              beatResolutions,
              (v) => v.toString(), // stateToItem
              (v) => parseInt(v), // itemToState
              true
            )
          }
          {createOptionMenu(
            "lineResolution",
            lineLengths,
            beatStringToResolution,
            resolutionToBeatString,
            true // localSetting
          )}
          {
            createBoolControl("per-instrumentResolution", true, "useIndividualResolution")
          }
          {
            !props.settings["useIndividualResolution"] && createOptionMenu(
              "primaryResolution",
              primaryResolutions,
              (v) => v.toString(), // stateToItem
              (v) => parseInt(v), // itemToState
              true
            )
          }
          {
            props.settings["useIndividualResolution"] && props.settings["individualResolutions"].map( instSetting => instrumentResolutionMenu(
              instSetting,
              primaryResolutions,
            ) ).reduce((prev, curr) => [prev, curr])
          }
        </List>
      </FormGroup>
  );
}

const DefaultSettings = notation.DEFAULT_FORMAT_CONFIG;


export { FormatSettings, DefaultSettings }
export default FormatSettings;
