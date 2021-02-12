import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import CustomTransferList from "./CustomTransferList";

function PatternCreateDialog(props)
{
  let [patternName, setPatternName] = React.useState(null);
  let [patternRecipe, setPatternRecipe] = React.useState([]);


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

  return <Dialog
    open={props.open}
    onClose={props.onClose}
    aria-labelledby="pattern-edit-dialog"
    aria-describedby="pattern-edit-dialog"
  >
    <DialogContent>
      <DialogContentText>
        Combine Patterns
      </DialogContentText>
      <CustomTransferList
        items={patternChoices}
        selectedItems={patternRecipe}
        onChange={setPatternRecipe}
      />
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
