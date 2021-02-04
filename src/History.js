// History.js

import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles((theme) => {return {
  root: {
    width: '100%',
    height: 400,
    minWidth: 200,
    maxWidth: 300,
    backgroundColor: theme.palette.background.paper,
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
      <div>Recently viewed</div>
      <List>
            {[...items.keys()].map ( x => renderRow({
              index : x,
              name: items[x].name,
              id: items[x].id,
              date: items[x].date,
              onClick: ()=>{if(props.onClick){props.onClick(items[x]);}}
            }))}
      </List>
    </div>
  );
};

export default History;
