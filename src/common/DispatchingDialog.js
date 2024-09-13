import React from 'react'
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import PropTypes from 'prop-types';

function DispatchingDialog(props) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle id="dispatching-dialog-title">{props.title}</DialogTitle>
      <DialogActions style={{justifyContent: "center"}}>
        <ButtonGroup orientation="vertical">
          {props.children}
          {props.omitCancel ||
            <Button onClick={props.onCancel} variant="contained">
              Cancel
            </Button>
          }
        </ButtonGroup>
      </DialogActions>
    </Dialog>
  );
}

DispatchingDialog.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func
};

export default DispatchingDialog;
