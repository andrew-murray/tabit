// History.js

import React from 'react'
import List from '@mui/material/List'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

function renderRow(props) {
  return (
    <ListItemButton style={props.style} key={props.index} onClick={props.onClick}>
      <ListItemText primary={props.name} secondary={props.date ? new Date(props.date).toLocaleDateString() : undefined}/>
    </ListItemButton>
  );
}

function History(props)
{
  const items = props.data;
  return (
    <Box sx={{ height: 400, minWidth: 200, maxWidth: 300, maxHeight: 300, overflow: 'auto' }}>
      <Paper>
        <Typography>Recent Songs</Typography>
        <Divider />
        <List data-testid="song-history">
              {[...items.keys()].map ( x => renderRow({
                index : x,
                name: items[x].name,
                id: items[x].id,
                date: items[x].date,
                onClick: ()=>{if(props.onClick){props.onClick(items[x]);}}
              }))}
        </List>
      </Paper>
    </Box>
  );
};

export default History;
