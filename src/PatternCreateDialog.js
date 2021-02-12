import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import CustomTransferList from "./CustomTransferList";

function PatternCreateDialog(props)
{
  let [selectedPatternIndex, setSelectedPatternIndex] = React.useState(null);
  let [patternRecipe, setPatternRecipe] = React.useState([]);


  const closeAndCommit = ()=>{
    if(patternRecipe.length)
    {
      props.onChange({name: "next", recipe: patternRecipe});
      setPatternRecipe([]);
    }
    props.onClose();
  };

  const patternChoices = [...props.patterns.keys()].map(
    index =>{ return {value: index, label: props.patterns[index]}; }
  );

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
      <DialogActions>
        <Button onClick={closeAndCommit}>
          Confirm
        </Button>
        <Button onClick={closeAndCommit}>
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
