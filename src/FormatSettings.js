import React from 'react'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Switch from '@mui/material/Switch'
import Select from '@mui/material/Select'
import notation from "./notation"
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from './common/TabitTooltip';

function camelToReadable(s)
{
  const spacedString = s.replace(/([A-Z])/g, ' $1');
  return spacedString[0].toUpperCase() + spacedString.slice(1);
}

function FormatSettings(props) {
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

    // awkwardly when using outlined, we need to specify label in two places, see https://mui.com/material-ui/react-select/
    return (
      <ListItem variant="filled" sx={{margin: 1}} styles={{minWidth:120}} key={idString} id={idString} style={{width:"75%"}}>
        <FormControl style={{width:"100%"}}>
          <InputLabel id="settings-option-{name}">{name}</InputLabel>
          <Select
            labelId={"settings-option-" + name + "-labelID"}
            id={"settings-option-" + name + "-id"}
            value={stateToItem(props.settings[name])}
            name={name}
            onChange={(e) => handleOptionChange( e.target.name, itemToState(e.target.value), localSetting)}
            style={{width:"75%", textAlign: "center"}}
            label={name}
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

  // beatResolution is *tremendously* limited for now
  // it technically has to look through all the active resolutions for each part
  // to make sure it can display a sensible candidate
  // TODO: Is it really worth having like this?
  const candidateBeatResolutions = [48, 96];
  let beatResolutions = [];
  for( const c of candidateBeatResolutions )
  {
    if( (c % props.pattern.resolution) === 0 && ( props.settings.lineResolution % c ) === 0)
    {
      beatResolutions.push( c );
    }
  }

  const candidatePrimaryResolutions = [4, 6, 8, 12, 16, 24, 36, 48];
  let primaryResolutions = [];
  for( const c of candidatePrimaryResolutions )
  {
    if((props.settings.lineResolution % c ) === 0 && (props.settings.beatResolution % c) === 0)
    {
      primaryResolutions.push( c );
    }
  }

  const resolutionLookup = {
    "4" : "1/32 triplet",
    "6" : "1/32",
    "8" : "1/16 triplet",
    "12" : "1/16",
    "16" : "1/8 triplet",
    "24" : "1/8",
    "36" : "1/4 triplet",
    "48" : "1/4",
    "72" : "1/2 triplet",
    "96" : "1/2"
  };

  const resolutionInverseLookup = Object.fromEntries( Object.entries(resolutionLookup).map( ([k,v]) => [v,k] ) );
  const resolutionToDisplayResolution = (num) =>
  {
    return resolutionLookup[num.toString()];
  };

  const displayResolutionToResolution = (s) =>
  {
    return parseInt(resolutionInverseLookup[s]);
  };

  const instrumentResolutionMenu = (
    instSetting,
    options
  ) =>
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
      <ListItem variant="filled" sx={{margin: 1}} styles={{minWidth:120}} key={idString} id={idString} style={{width:"75%"}}>
        <FormControl style={{width:"100%"}}>
          <InputLabel id={"settings-option-" + name}>{name} resolution</InputLabel>
          <Select
            labelId={"resolution-option-" + name + "-labelID"}
            id={"resolution-option-" + name + "-id"}
            value={props.settings["individualResolutions"][instSetting.index].resolution}
            name={name}
            onChange={updateInstrumentResolutions}
            style={{width:"75%", textAlign: "center"}}
            label={name + " resolution"}
          >
            {options.map((op) => <MenuItem key={"settings-menu-item-" + name + "-" + op} value={op} style={{textAlign: "center"}}>{resolutionToDisplayResolution(op)}</MenuItem>)}
          </Select>
        </FormControl>
      </ListItem>
    );
  };

  const [settingsTabIndex, setSettingsTabIndex] = React.useState(0);

  const handleTabChange = (event, newIndex) => {
    setSettingsTabIndex(newIndex);
  };

  return (
    <FormGroup>
      <Tabs value={settingsTabIndex} onChange={handleTabChange} aria-label="Settings Tabs" variant="fullWidth">
        <Tab label={
          <Tooltip
            title="Settings for all patterns"
            show={props.showHelp}
          >
            <span>Song</span>
          </Tooltip>
        }/>
        <Tab label={
          <Tooltip
            show={props.showHelp}
            title="Settings for this pattern"
          >
            <span>Pattern</span>
          </Tooltip>
        }/>
      </Tabs>
      {settingsTabIndex === 0 &&
        <List>
          {notation.FORMAT_CONFIG_STRINGS.map( op => createOptionMenu( op[0], op[1] ) ).reduce((prev, curr) => [prev, curr])}
          {notation.FORMAT_CONFIG_BOOLS.map( op => createBoolControl( op, false )).reduce((prev, curr) => [prev, curr]) }
        </List>
      }
      {settingsTabIndex === 1 &&
        <List>
          {
            createOptionMenu(
              "beatResolution",
              beatResolutions,
              displayResolutionToResolution, // itemToState
              resolutionToDisplayResolution, // stateToItem
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
              displayResolutionToResolution, // itemToState
              resolutionToDisplayResolution, // stateToItem
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
      }
      </FormGroup>
  );
}

const DefaultSettings = notation.DEFAULT_FORMAT_CONFIG;


export { FormatSettings, DefaultSettings }
export default FormatSettings;
