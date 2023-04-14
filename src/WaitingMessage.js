import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';


export default function WaitingMessage(props)
{
  return (
    <Box className="App">
      <div>
        <CircularProgress color="secondary"/>
        <Typography> {props.message} </Typography>
      </div>
    </Box>
  );
}