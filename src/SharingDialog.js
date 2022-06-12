import PropTypes from 'prop-types';
import React from 'react';
import copy from "copy-to-clipboard";
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import FileCopyIcon from '@mui/icons-material/FileCopy';


function SharingDialog(props)
{
  return <Dialog
    open={props.open}
    onClose={props.onClose}
    aria-labelledby="sharing-dialog"
    aria-describedby="sharing-dialog"
  >
    <DialogContent>
      <DialogContentText>
      Your song is available at
      </DialogContentText>
      <DialogContentText>
      {props.url}
      <IconButton onClick={(e)=>{ copy(props.url); }}>
        <FileCopyIcon />
      </IconButton>
      </DialogContentText>
      <DialogActions>
        <Button onClick={props.onClose}>
          Close
        </Button>
      </DialogActions>
    </DialogContent>
  </Dialog>
}

SharingDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  url: PropTypes.string
}

export default React.memo(SharingDialog);
