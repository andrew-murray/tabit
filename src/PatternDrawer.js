import React from "react";
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TabitBar from "./TabitBar";
import ClearIcon from '@material-ui/icons/Clear';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { isMobile } from "./Mobile";

function PatternDrawer(props)
{
  const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const mobile = isMobile();

  // SwipableDawer has undesirable behaviour,
  // (a) persistent isn't handled properly
  // (b) onOpen of swipable drawer, is only called on swipe events
  // I can't find convenient callbacks to hook into that are called "when the component exists"
  // (components are deleted when the swipable drawer is closed)
  // I think my approach would have to involve modifying the content in the swipeable drawer in
  // a somewhat complex way sadly - not yet

  return (
    <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS}
    variant={mobile ? undefined : "persistent"}
    open={props.open}
    onOpen={props.onOpen}
    onClose={props.onClose}
    >
      {!mobile ? <TabitBar placeholder /> : null }
      <div
        style={{overflow: "auto"}}
      >
        <List>
          {(props.patterns ?? []).map( (pattern, index) => (
            <ListItem
              button
              key={"drawer-pattern" + index.toString()}
              onClick={() => { if(props.selectPattern){props.selectPattern(index);} }}
            >
              <ListItemText primary={pattern.name} />
              {props.onRemove &&
                <ListItemIcon>
                  <IconButton onClick={(event)=>{
                    event.stopPropagation();
                    event.preventDefault();
                    props.onRemove(index);}
                  }>
                    <ClearIcon fontSize="small"/>
                  </IconButton>
                </ListItemIcon>
              }
            </ListItem>
          ))}
          {props.onAdd &&
            <ListItem
              button
              key={"drawer-add-button"}
            >
              <ListItemIcon>
                <IconButton onClick={()=>{props.onAdd();}} aria-label="add">
                  <AddBoxIcon/>
                </IconButton>
              </ListItemIcon>
            </ListItem>
          }
        </List>
      </div>
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default React.memo(PatternDrawer);
