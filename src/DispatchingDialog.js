import React from 'react'
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
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
