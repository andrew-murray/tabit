import React from 'react'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';

function TitledDialog(props) {

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle id="text-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} variant="contained">
          ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TitledDialog.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func
};

export default TitledDialog;
