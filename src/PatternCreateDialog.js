import PropTypes from 'prop-types';
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CustomTransferList from "./CustomTransferList";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

function PatternCreateDialog(props)
{

  const patternChoices = [...props.patterns.keys()].map(
    index =>{ return {value: index, label: props.patterns[index]}; }
  );

  let [patternNameCreate, setPatternNameCreate] = React.useState(null);
  let [patternNameCombine, setPatternNameCombine] = React.useState(null);
  let [patternRecipe, setPatternRecipe] = React.useState([]);
  let [patternReorderRemaining, setPatternReorderRemaining] = React.useState( patternChoices );
  let [patternReorder, setPatternReorder] = React.useState([]);
  let [createExpanded, setCreateExpanded] = React.useState(true);
  let [combineExpanded, setCombineExpanded] = React.useState(false);
  let [rearrangeExpanded, setRearrangeExpanded] = React.useState(false);
  let [combineSynchronous, setCombineSynchronous] = React.useState(false);

  const resetState = () => {
    setPatternNameCombine(null);
    setPatternNameCreate(null);
    setPatternRecipe([]);
    setPatternReorder([]);

    // we could change these to a default, but this and combineSynchronous
    // are more helpful as persistent modes.
    // setCreateExpanded(true);
    // setCombineExpanded(false);
    // setRearrangeExpanded(false);
    // setCombineSynchronous(false);
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
      props.onChange({name: patternNameCreate})
      resetState();
    }
    else if(combineExpanded)
    {
      // validate all fields and generate errors
      if(patternRecipe && patternNameCombine)
      {
        props.onChange({name: patternNameCombine, recipe: patternRecipe, synchronous: combineSynchronous});
        resetState();
      }
    }
    else
    {
      console.error("unreachable code in closeAndCommit");
    }
    props.onClose();
  };

  const patternNameIsValid = (name) => name && props.patterns.indexOf(name) === -1;

  const createExpandedToggle = (event, enabled) =>
  {
    setCombineExpanded(!enabled);
    setCreateExpanded(enabled);
    setRearrangeExpanded(!enabled);
  };
  const combineExpandedToggle = (event, enabled) =>
  {
    setCombineExpanded(enabled);
    setCreateExpanded(!enabled);
    setRearrangeExpanded(!enabled);
  };
  const rearrangeExpandedToggle = (event, enabled) =>
  {
    setCombineExpanded(!enabled);
    setCreateExpanded(!enabled);
    setRearrangeExpanded(enabled);
  };

  const combineOptionsCommitable = patternRecipe.length >= 1 && patternNameIsValid(patternNameCombine);
  const createOptionsCommitable = patternNameIsValid(patternNameCreate);
  const canCommit = (
    ( combineExpanded && combineOptionsCommitable)
    || (createExpanded && createOptionsCommitable)
  );


  const handleEnter = (e) =>
  {
    if(e.keyCode === 13 && canCommit)
    {
      e.preventDefault();
      closeAndCommit(true);
    }
  };

  const consecutiveString = "Consecutive";
  const synchronousString = "Synchronous";
  const handleCombineSyncChange = (e) =>
  {
    const sync = e.target.value === synchronousString;
    setCombineSynchronous(sync);
  };

  return <Dialog
    open={props.open}
    onClose={props.onClose}
    aria-labelledby="pattern-edit-dialog"
    aria-describedby="pattern-edit-dialog"
  >
    <DialogContent
    >
      <Accordion expanded={createExpanded} onChange={createExpandedToggle}>
      <AccordionSummary
        aria-controls="option-create"
        id="panel-create"
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>Create new pattern</Typography>
      </AccordionSummary>
      <AccordionDetails>
      <Box style={{display: "flex", flexDirection: "column"}}>
        <TextField
          error={patternNameCreate && !patternNameIsValid(patternNameCreate)}
          label="Pattern Name"
          helperText={patternNameCreate && !patternNameIsValid(patternNameCreate) ? "Pattern names must be unique." : undefined}
          variant="outlined"
          onChange={(event)=>{setPatternNameCreate(event.target.value);}}
          style={{alignSelf: "flex-end"}}
          onKeyDown={handleEnter}
        />
      </Box>
      </AccordionDetails>
      </Accordion>
      <Accordion expanded={combineExpanded} onChange={combineExpandedToggle}>
      <AccordionSummary
        aria-controls="option-combine"
        id="panel-combine"
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>Combine Patterns</Typography>
      </AccordionSummary>
      <AccordionDetails style={{display: "flex", flexDirection: "column"}}>
        <CustomTransferList
          items={patternChoices}
          selectedItems={patternRecipe}
          onChange={setPatternRecipe}
        />
        <Box style={{display: "flex", flexDirection: "row"}}>
          <Box style={{flexGrow: 1}} />
          <Box style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
            <RadioGroup
              aria-labelledby="radio-combine-mode"
              name="radio-combine-mode"
              value={combineSynchronous ? synchronousString : consecutiveString}
              onChange={handleCombineSyncChange}
            >
              <FormControlLabel value={synchronousString} control={<Radio />} label={synchronousString} />
              <FormControlLabel value={consecutiveString} control={<Radio />} label={consecutiveString} />
            </RadioGroup>
          </Box>
          <Box style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
            <TextField
              error={patternNameCombine && !patternNameIsValid(patternNameCombine)}
              label="Pattern Name"
              helperText={patternNameCombine && !patternNameIsValid(patternNameCombine) ? "Pattern names must be unique." : undefined}
              variant="outlined"
              onChange={(event)=>{setPatternNameCombine(event.target.value);}}
              style={{alignSelf: "flex-end"}}
              onKeyDown={handleEnter}
            />
          </Box>
        </Box>
      </AccordionDetails>
      </Accordion>
      { false && <Accordion expanded={rearrangeExpanded} onChange={rearrangeExpandedToggle}>
      <AccordionSummary
        aria-controls="option-rearrange"
        id="panel-rearrange"
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>Rearrange Patterns</Typography>
      </AccordionSummary>
      <AccordionDetails style={{display: "flex", flexDirection: "column"}}>
        <CustomTransferList
          items={patternReorderRemaining}
          selectedItems={patternReorder}
          onChange={(e)=>{
            const valuesInSelected = e.map(e=>e.value);
            const remaining = patternChoices.filter(p=>!valuesInSelected.includes(p.value));
            // todo: doing this is broken
            // either the things must be controlled/uncontrolled
            setPatternReorderRemaining(remaining);
            setPatternReorder(e);
          }}
        />
      </AccordionDetails>
      </Accordion>
    }
    </DialogContent>
    <DialogActions>
      <Button onClick={()=>{closeAndCommit(true)}} disabled={!canCommit}>
        Confirm
      </Button>
      <Button onClick={()=>{closeAndCommit(false)}} disabled={false}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
}

PatternCreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patterns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PatternCreateDialog;
