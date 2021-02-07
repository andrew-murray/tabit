import PropTypes from 'prop-types';
import copy from "copy-to-clipboard";
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import FileCopyIcon from '@material-ui/icons/FileCopy';


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

export default SharingDialog;
