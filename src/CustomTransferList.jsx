import React from "react";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import IconButton from '@mui/material/IconButton';
import ReplayIcon from '@mui/icons-material/Replay';

/*
  This file is based on the transfer-list example available in material UI.
  https://material-ui.com/components/transfer-list/
*/

export default function TransferList({items, selectedItems, onChange}) {

  const [checked, setChecked] = React.useState(items.map(item => false));

  const handleChecked = (itemIndex) => {
    const newChecked = [...checked.keys()].map(index=>(index===itemIndex ? !checked[index] : checked[index]));
    setChecked( newChecked );
  };

  const handleCheckedRight = () => {
    const newValues = selectedItems.concat( items.filter(item=>checked[item.value]) );
    if(onChange){ onChange(newValues); }
    setChecked(items.map(item => false))
  };

  const handleReset = () => {
    if(onChange){ onChange([]); }
    setChecked(items.map(item => false))
  };

  const customList = (items, checkable) => (
    <Paper sx={{
      width: "200px",
      height: "230px",
      overflow: "auto"
    }}>
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
              { checkable &&
                <ListItemIcon>
                <Checkbox
                  checked={checked[item.value]}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": labelId }}
                />
                </ListItemIcon>
              }
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
      sx={{margin: "auto"}}
    >
      <Grid item>{customList(items, true)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <IconButton
            size="small"
            onClick={handleCheckedRight}
            aria-label="move selected right"
            sx={{mx:0.5, my:0}}
          >
            &gt;
          </IconButton>
          <IconButton
            variant="outlined"
            size="small"
            onClick={handleReset}
            aria-label="reset"
            sx={{mx:0.5, my:0}}
          >
            <ReplayIcon />
          </IconButton>
        </Grid>
      </Grid>
      <Grid item>{customList(selectedItems, false)}</Grid>
    </Grid>
  );
}
