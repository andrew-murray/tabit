// FileUpload.react.js

// inspired by https://gist.github.com/AshikNesin/e44b1950f6a24cfcd85330ffc1713513
// and https://stackoverflow.com/questions/55830414/how-to-read-text-file-in-react

import React from 'react'

class FileImport extends React.Component {

  constructor(props) {
    super(props);
    this.state ={
      file: null,
      content: null
    }
    this.onChange = this.onChange.bind(this)
  }

  onChange(e) {
    const fileObject = e.target.files[0]
    const reader = new FileReader()
    reader.onload = loadEvent => this.setState( { file: fileObject, content : loadEvent.target.result})
    reader.readAsText(fileObject);
  }

  render() {
    return (
      <input type="file" onChange={this.onChange} />
   )
  }
}

export default FileImport;
