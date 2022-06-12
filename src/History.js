// History.js

import React from 'react'
import { makeStyles } from '@mui/styles'
import List from '@mui/material/List'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

const useStyles = makeStyles(() => {return {
  root: {
    width: '100%',
    height: 400,
    minWidth: 200,
    maxWidth: 300,
    maxHeight: 200,
    overflow: 'auto'
  }
}});

function renderRow(props) {
  return (
    <ListItem button style={props.style} key={props.index} onClick={props.onClick}>
      <ListItemText primary={props.name} secondary={new Date(props.date).toLocaleDateString()}/>
    </ListItem>
  );
}

function History(props)
{
  const classes = useStyles();
  const items = props.data;
  return (
    <div className={classes.root}>
      <Paper>
        <Typography>Recently viewed</Typography>
        <Divider />
        <List>
              {[...items.keys()].map ( x => renderRow({
                index : x,
                name: items[x].name,
                id: items[x].id,
                date: items[x].date,
                onClick: ()=>{if(props.onClick){props.onClick(items[x]);}}
              }))}
        </List>
      </Paper>
    </div>
  );
};

export default History;
