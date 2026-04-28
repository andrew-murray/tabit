// FileUpload.react.js

// inspired by https://gist.github.com/AshikNesin/e44b1950f6a24cfcd85330ffc1713513
// and https://stackoverflow.com/questions/55830414/how-to-read-text-file-in-react

import React from 'react'
import Button from '@mui/material/Button';

class FileImport extends React.Component {

  constructor(props) {
    super(props);
    this.hiddenFileInput = React.createRef();
  }

  onChange(e) {
    const fileObject = e.target.files[0]
    const reader = new FileReader()
    reader.onload = loadEvent => {
      if( this.props.onImport )
      {
        this.props.onImport(
          { file: fileObject, content : loadEvent.target.result}
        );
      }
    }
    reader.readAsText(fileObject);
  }

  render() {
    const clickFile = (e) => {
      this.hiddenFileInput.current.click();
    }

    const {onImport, accept, ...buttonProps} = {...this.props};
    return (
      <React.Fragment>
        <Button onClick={clickFile} {...buttonProps}>Import File</Button>
        <input
          type="file"
          hidden
          accept={accept}
          onChange={(e) => this.onChange(e)} ref={this.hiddenFileInput}
          />
      </React.Fragment>
   )
  }
}

export default FileImport;
