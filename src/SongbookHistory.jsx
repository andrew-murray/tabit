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
    <Box sx={{ height: { sm: 400 }, minWidth: 200, maxWidth: 300, maxHeight: 300, overflow: 'auto' }}>
      <Paper>
        <Typography>Songbooks</Typography>
        <Divider />
        <List data-testid="songbook-list">
              {[...items.keys()].map ( x => renderRow({
                index : x,
                name: items[x].data.name,
                id: items[x].data.id,
                date: items[x].data.date,
                onClick: ()=>{if(props.onClick){props.onClick(items[x]);}}
              }))}
        </List>
      </Paper>
    </Box>
  );
};

export default History;
