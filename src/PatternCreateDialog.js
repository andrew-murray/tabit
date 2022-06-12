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
import { createStyles, makeStyles } from '@mui/styles';

// FIXME: MUI (V5) doesn't support makeStyles with a theme, unless you provide it
// and provides more convenient syntax for doing this anyhow - update this usage
const useStyles = makeStyles((theme) => (
  createStyles({
    root: {
      backgroundColor: theme.palette.primary.main
    }
  })
));

function PatternCreateDialog(props)
{
  let [patternNameCreate, setPatternNameCreate] = React.useState(null);
  let [patternNameCombine, setPatternNameCombine] = React.useState(null);
  let [patternRecipe, setPatternRecipe] = React.useState([]);
  let [createExpanded, setCreateExpanded] = React.useState(true);
  let [combineExpanded, setCombineExpanded] = React.useState(false);

  const resetState = () => {
    setPatternNameCombine(null);
    setPatternNameCreate(null);
    setPatternRecipe([]);
    // todo: assume this to be exclusive and change to a "mode" rather than many bool flags
    setCreateExpanded(true);
    setCombineExpanded(false);
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
        props.onChange({name: patternNameCombine, recipe: patternRecipe});
        resetState();
      }
    }
    else
    {
      console.error("unreachable code in closeAndCommit");
    }
    props.onClose();
  };

  const patternChoices = [...props.patterns.keys()].map(
    index =>{ return {value: index, label: props.patterns[index]}; }
  );

  const patternNameIsValid = (name) => name && props.patterns.indexOf(name) === -1;

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

  const classes = useStyles();

  return <Dialog
    open={props.open}
    onClose={props.onClose}
    aria-labelledby="pattern-edit-dialog"
    aria-describedby="pattern-edit-dialog"
  >
    <DialogContent
      className={classes.root}
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
        <Box style={{display: "flex", flexDirection: "column"}}>
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
      </AccordionDetails>
      </Accordion>
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
