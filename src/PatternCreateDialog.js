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


  const closeAndCommit = (commit)=>{
    if(commit && patternRecipe.length && patternName)
    {
      props.onChange({name: patternName, recipe: patternRecipe});
    }
    setPatternRecipe([]);
    setPatternName(null);
    props.onClose();
  };

  const patternChoices = [...props.patterns.keys()].map(
    index =>{ return {value: index, label: props.patterns[index]}; }
  );

  const invalidPatternName = patternName && props.patterns.indexOf(patternName) !== -1;

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
        <Typography>TODO</Typography>
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
          error={invalidPatternName}
          label="Pattern Name"
          helperText={invalidPatternName ? "Pattern names must be unique." : undefined}
          variant="outlined"
          onChange={(event)=>{setPatternName(event.target.value);}}
          style={{alignSelf: "flex-end"}}
        />
      </Box>
      <DialogActions>
        <Button onClick={()=>{closeAndCommit(true)}} disabled={patternRecipe.length === 0 || !patternName || invalidPatternName}>
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
