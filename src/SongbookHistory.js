// History.js

import React from 'react'
import { makeStyles } from '@mui/styles'
import List from '@mui/material/List'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

const useStyles = makeStyles((styles) => {return {
  root: {
    [styles.breakpoints.up('sm')]: {
      height: 400,
    },
    minWidth: 200,
    maxWidth: 300,
    maxHeight: 300,
    overflow: 'auto'
  }
}});

function renderRow(props) {
  return (
    <ListItem button style={props.style} key={props.index} onClick={props.onClick}>
      <ListItemText primary={props.name} secondary={props.date ? new Date(props.date).toLocaleDateString() : undefined}/>
    </ListItem>
  );
}

function History(props)
{
  const classes = useStyles();
  const items = props.data;
  return (
    <Box className={classes.root}>
      <Paper>
        <Typography>Songbooks</Typography>
        <Divider />
        <List>
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
