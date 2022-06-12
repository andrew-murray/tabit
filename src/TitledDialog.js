import React from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
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
