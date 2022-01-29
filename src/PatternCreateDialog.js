import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CustomTransferList from "./CustomTransferList";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';



const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      backgroundColor: "#111111"
    },
  }),
);

function PatternCreateDialog(props)
{
  let [patternName, setPatternName] = React.useState(null);
  let [patternRecipe, setPatternRecipe] = React.useState([]);
  let [createExpanded, setCreateExpanded] = React.useState(true);
  let [combineExpanded, setCombineExpanded] = React.useState(false);
  let [timeSignatureNumString, setTimeSignatureNumString] = React.useState("");
  let [timeSignatureDenom, setTimeSignatureDenom] = React.useState(4);
  let [patternResolution, setPatternResolution] = React.useState(16);

  const resetState = () => {
    setPatternName(null);
    setPatternRecipe([]);
    setCreateExpanded(true);
    setCombineExpanded(false);
    setTimeSignatureNumString("");
    setTimeSignatureDenom(4);
    setPatternResolution(16);
  };

  const closeAndCommit = (commit)=>{
    if(!commit)
    {
      // we're cancelling
      resetState();
      props.onClose();
      return;
    }
    if(createExpanded)
    {

    }
    else if(combineExpanded)
    {
      // validate all fields and generate errors
      if(patternRecipe && patternName)
      {
        props.onChange({name: patternName, recipe: patternRecipe});
      }

    }
    else
    {
      console.error("unreachable code in closeAndCommit");
    }
  };

  const patternChoices = [...props.patterns.keys()].map(
    index =>{ return {value: index, label: props.patterns[index]}; }
  );

  const invalidPatternName = !patternName || props.patterns.indexOf(patternName) !== -1;
  const timeSignatureNum = parseInt( timeSignatureNumString );
  const timeSignatureNaN = isNaN(timeSignatureNum)
  const timeSignatureNonPositive = !timeSignatureNaN && timeSignatureNum <= 1;
  const createOptionsCommitable = !timeSignatureNaN && !timeSignatureNonPositive;

  const createExpandedToggle = (event, enabled) =>
  {
    setCreateExpanded(enabled);
    if(combineExpanded)
    {
      setCombineExpanded(!enabled);
    }
  };
  const combineExpandedToggle = (event, enabled) =>
  {
    if(createExpanded)
    {
      setCreateExpanded(!enabled);
    }
    setCombineExpanded(enabled);
  };
  const classes = useStyles();

  const timeSignatureDenomOptions = [2, 4, 8, 16, 32];
  // onKeyDown={handleEnter}

  const resolutionOptions = [
    "8",
    "16",
    "32",
    "8T",
    "16T",
    "32T"
  ];

  const combineOptionsCommitable = patternRecipe.length >= 1;
  const canCommit = !invalidPatternName && (
    ( combineExpanded && combineOptionsCommitable)
    || (createExpanded && createOptionsCommitable)
  );

  // FIXME: This essentially needs tooltips everywhere

  return <Dialog
    open={props.open}
    onClose={props.onClose}
    aria-labelledby="pattern-edit-dialog"
    aria-describedby="pattern-edit-dialog"
  >
    <DialogContent>
      <Accordion expanded={createExpanded} onChange={createExpandedToggle}>
      <AccordionSummary
        aria-controls="option-create"
        id="panel-create"
        expandIcon={<ExpandMoreIcon />}
        className={classes.root}
      >
        <Typography>Create new pattern</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup aria-label="time-signature-controls" row>
          <Typography style={{"padding": 5}}>PatternLength</Typography>
          <TextField
            error={timeSignatureNumString.length > 0 && (timeSignatureNonPositive || timeSignatureNaN)}
            helperText={
              timeSignatureNumString.length > 0 && (timeSignatureNonPositive || timeSignatureNaN) ?
                (timeSignatureNonPositive ? "Please enter a number >= 1." : "Please enter a number.")
                : undefined
            }
            value={timeSignatureNumString}
            variant="outlined"
            onChange={(event)=>{
              console.log("setting ts-num string " + event.target.value)
              setTimeSignatureNumString(event.target.value);
            }}
          />
          <div style={{alignItems: "center", display: "inline-flex"}}>
            <Typography style={{paddingLeft: 5, paddingRight: 5}}>/</Typography>
          </div>
          <Select
            labelId={"time-signature-denom-label"}
            id={"time-signature-denom"}
            onChange={(e) => setTimeSignatureDenom( e.target.value )}
            value={timeSignatureDenom}
            IconComponent={()=><React.Fragment/>}
          >
            {timeSignatureDenomOptions.map((op) => <MenuItem
              key={"ts-" + op.toString()}
              value={op}
            >
                {op.toString()}
              </MenuItem>)}
          </Select>
        </FormGroup>
      </AccordionDetails>
      </Accordion>
      <Accordion expanded={combineExpanded} onChange={combineExpandedToggle}>
      <AccordionSummary
        aria-controls="option-combine"
        id="panel-combine"
        expandIcon={<ExpandMoreIcon />}
        className={classes.root}
      >
        <Typography>Combine Patterns</Typography>
      </AccordionSummary>
      <AccordionDetails style={{display: "flex", flexDirection: "column"}}>
        <CustomTransferList
          items={patternChoices}
          selectedItems={patternRecipe}
          onChange={setPatternRecipe}
        />
      </AccordionDetails>
      </Accordion>
      <Box style={{display: "flex", flexDirection: "column"}}>
        <TextField
          error={patternName && invalidPatternName}
          label="Pattern Name"
          helperText={patternName && invalidPatternName ? "Pattern names must be unique." : undefined}
          variant="outlined"
          onChange={(event)=>{setPatternName(event.target.value);}}
          style={{alignSelf: "flex-end"}}
        />
      </Box>
      <DialogActions>
        <Button onClick={()=>{closeAndCommit(true)}} disabled={!canCommit}>
          Confirm
        </Button>
        <Button onClick={()=>{closeAndCommit(false)}}>
          Close
        </Button>
      </DialogActions>
    </DialogContent>
  </Dialog>
}

PatternCreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patterns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PatternCreateDialog;
