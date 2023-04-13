import DispatchingDialog from "./DispatchingDialog";
import Button from '@mui/material/Button';
import FileImport from "./FileImport";

/*

<FileImport
          style={{margin: "1em"}}
          variant="contained"
          onImport={handleFileImport}
          accept=".tabit,.h2song"
          color="secondary"
          />

          &/
*/




export default function AddSongDialog (props) {

  const handleFileImport = (content) => {
    console.log("tabit file encountered");
    props.onClose();
  };

  const handleURLImport = (content) => {
    console.log("url encountered");
    props.onClose();

  };

  return <DispatchingDialog
    open={props.open}
    onCancel={props.onClose}
    title={"Add song to collection"}
  >

        <Button onClick={handleURLImport}>
          Import from URL
        </Button>
        <FileImport
          onImport={handleFileImport}
          accept=".tabit"
        />
  </DispatchingDialog>;
};