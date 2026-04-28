import React from "react";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import TextField from '@mui/material/TextField';

const resolutionOptions = [
  "8",
  "16",
  "32",
  "8T",
  "16T",
  "32T"
];

class ChangePatternLengthDialog extends React.Component
{
  constructor(props)
  {
    super(props)
    this.state = {
      currentValue : null,
      timeSignatureNumString: "",
      timeSignatureDenom: resolutionOptions[1]
    };
  }

  render()
  {

    const cancel = () => {
      if(this.props.onCancel)
      {
        this.props.onCancel();
      }
      this.setState({currentValue: null});
    };

    const confirm = () => {
      if(this.state.currentName !== null)
      {
        const instrumentName = this.state.currentValue.trim();
        if( instrumentName.length > 0 )
        {
          if(this.props.onChange)
          {
            this.props.onChange(this.state.currentValue);
          }
          this.setState({currentValue: null});
        }
        else
        {
          // todo: prettier error communication?
          alert(
            "You selected an invalid name \"" + this.state.currentValue + "\".\n" +
            "Must be non-empty."
          );
        }
      }
      else
      {
        cancel();
      }
    };

    const handleEnter = (e) =>
    {
      if(e.keyCode === 13)
      {
        e.preventDefault();
        confirm();
      }
    };

    return (
      <Dialog open={this.props.open} onClose={cancel} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title"></DialogTitle>
        <DialogContent>
          <DialogContentText>
            {this.props.instruction}
          </DialogContentText>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            value={this.state.currentValue ?? this.props.value}
            onChange={(e)=>{this.setState({currentValue: e.target.value});}}
            onKeyDown={handleEnter}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel} color="primary">
            Cancel
          </Button>
          <Button onClick={confirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
};

export default ChangePatternLengthDialog;
