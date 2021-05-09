import React from 'react';
import {Editor, EditorState, ContentState, convertToRaw} from 'draft-js';
import Paper from "@material-ui/core/Paper";
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';

function ErrorReport(props)
{
  return (
    <Alert severity="error">
      <Box>
      {props.content.split("\n").map(line=><Box>{line}</Box>)}
      </Box>
    </Alert>
  );
}

function PatternEditor(props) {
  const initialEditorState = props.content ? EditorState.createWithContent(ContentState.createFromText(props.content))
    : EditorState.createEmpty();
  const [editorState, setEditorState] = React.useState( initialEditorState );

  const editor = React.useRef(null);

  function focusEditor() {
    editor.current.focus();
  }

  React.useEffect(() => {
    focusEditor()
  }, []);

  const onChange = (editorState) => {
    setEditorState(editorState);
    const contentState = convertToRaw(editorState.getCurrentContent());
    const lines = contentState.blocks.map( block => block.text );
    if(props.onChange)
    {
      props.onChange(lines)
    }
  };

  // text-decoration: underline wavy red; for some blocks?

  return (
    <Paper onClick={focusEditor} style={{width:"50%", margin:"auto"}}>
      <Editor
        ref={editor}
        editorState={editorState}
        onChange={onChange}
      />
      {
        props.errors.map(e => <ErrorReport content={e.message} />)
      }
    </Paper>
  );
}

export default PatternEditor;
