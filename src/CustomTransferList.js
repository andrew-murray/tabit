import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import IconButton from '@material-ui/core/IconButton';
import ReplayIcon from '@material-ui/icons/Replay';
import AddIcon from '@material-ui/icons/Add';

/*
  This file is based on the transfer-list example available in material UI.
  https://material-ui.com/components/transfer-list/
*/

const useStyles = makeStyles((theme) => ({
  root: {
    margin: "auto"
  },
  paper: {
    width: 200,
    height: 230,
    overflow: "auto"
  },
  button: {
    margin: theme.spacing(0.5, 0)
  }
}));

function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a, b) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

export default function TransferList({items}) {
  const classes = useStyles();

  const [checked, setChecked] = React.useState(items.map(item => false));
  const [selectedItems, setSelectedItems] = React.useState([]);

  const handleChecked = (itemIndex) => {
    const newChecked = [...checked.keys()].map(index=>(index===itemIndex ? !checked[index] : checked[index]));
    setChecked( newChecked );
  };

  const handleCheckedRight = () => {
    const newValues = items.filter(item=>checked[item.value]);
    setSelectedItems(selectedItems.concat(newValues))
    setChecked(items.map(item => false))
  };

  const handleReset = () => {
    setSelectedItems([]);
    setChecked(items.map(item => false))
  };

  const customList = (items) => (
    <Paper className={classes.paper}>
      <List dense component="div" role="list">
        {items.map((item) => {
          const labelId = `transfer-list-item-${item.value}-label`;

          return (
            <ListItem
              key={item.value}
              role="listitem"
              button
              onClick={()=>{handleChecked(item.value)}}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked[item.value]}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={item.label} />
            </ListItem>
          );
        })}
        <ListItem />
      </List>
    </Paper>
  );

  return (
    <Grid
      container
      spacing={2}
      justify="center"
      alignItems="center"
      className={classes.root}
    >
      <Grid item>{customList(items)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <IconButton
            size="small"
            className={classes.button}
            onClick={handleCheckedRight}
            aria-label="move selected right"
          >
            <AddIcon />
          </IconButton>
          <IconButton
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleReset}
            aria-label="reset"
          >
            <ReplayIcon />
          </IconButton>
        </Grid>
      </Grid>
      <Grid item>{customList(selectedItems)}</Grid>
    </Grid>
  );
}
