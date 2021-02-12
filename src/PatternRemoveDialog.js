import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import CustomTransferList from "./CustomTransferList";

function PatternRemoveDialog(props)
{
  let [selectedPatternIndex, setSelectedPatternIndex] = React.useState(null);

  const closeAndCommit = ()=>{
    if(selectedPatternIndex !== null)
    {
      props.onChange({ index: selectedPatternIndex, name: props.patterns[selectedPatternIndex] } );
      setSelectedPatternIndex(null);
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
        Remove Pattern (this is a permanent operation)
      </DialogContentText>
      <CustomTransferList
        items={patternChoices}
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

PatternRemoveDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patterns: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PatternRemoveDialog;
