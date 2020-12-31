// History.js

import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: 400,
    maxWidth: 300,
    backgroundColor: theme.palette.background.paper,
  },
}));


function renderRow(props) {
  return (
    <ListItem button style={props.style} key={props.index} onClick={props.onClick}>
      <ListItemText primary={props.name} secondary={new Date(props.date).toLocaleDateString()}/>
    </ListItem>
  );
}

const demoData = [
  {name: "roudesann", id: "3b415c320894e531f4daa93711949e78c0aef281", "date": Date.now()},
  {name: "groovy", id: "f23c52481af0c08f5037d820a0cf33e886061ffc", "date": Date.now()},
  {name: "too_much", id: "e7db6989c558e201bceff225d796f0d6073047a9", "date": Date.now()}
];

function History(props)
{
  const classes = useStyles();
  const items = props.data ?? demoData;
  return (
    <div style={{maxHeight: 200, overflow: 'auto'}} className={classes.root}>
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
