import React from "react";
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import TabitBar from "./TabitBar";
import ClearIcon from '@material-ui/icons/Clear';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { isMobile } from "./Mobile";

const PatternListItem = (props) =>
{
  const {
    selectPattern,
    index,
    pattern,
    onRemove
  } = props;
  const selectCallback = React.useCallback(
    ()=>{
      if(selectPattern){selectPattern(index);}
    },
    [index, selectPattern]
  );
  const removeCallback = React.useCallback(
    (event)=>{
      event.stopPropagation();
      event.preventDefault();
      onRemove(index);
    },
    [index, onRemove]
  );
  return (<ListItem
    button
    key={"drawer-pattern" + index.toString()}
    onClick={selectCallback}
  >
    <ListItemText primary={pattern.name} />
    {onRemove &&
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          size="small"
          onClick={removeCallback}
        >
          <ClearIcon fontSize="small"/>
        </IconButton>
      </ListItemSecondaryAction>
    }
  </ListItem>
  );
};

function DrawerContent(props)
{
  return (<React.Fragment>
    {!isMobile ? <TabitBar placeholder /> : null }
    <div
      style={{overflow: "auto"}}
    >
      <List>
        {(props.patterns ?? []).map( (pattern, index) =>
          <PatternListItem
            pattern={pattern}
            key={"pattern-key-" + String(index)}
            index={index}
            onRemove={props.onRemove}
            selectPattern={props.selectPattern}
          />
        )}
        {props.onAdd &&
          <ListItem
            key={"drawer-add-button"}
          >
            <ListItemText />
            <ListItemSecondaryAction>
              <IconButton
                size="small"
                edge="end"
                onClick={()=>{props.onAdd();}}
                aria-label="add"
              >
                <AddCircleIcon
                  size="small"
                  edge="end"
                  />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        }
      </List>
    </div>
  </React.Fragment>
  );
}

const MemoizedDrawerContent = React.memo(DrawerContent);

function PatternDrawer(props)
{
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <SwipeableDrawer
    disableBackdropTransition={!iOS} disableDiscovery={iOS}
    variant={isMobile ? undefined : "persistent"}
    open={props.open}
    onOpen={props.onOpen}
    onClose={props.onClose}
    // we insist that the component not be created from scratch,
    // as this causes a horrible lag in the component rendering/sound stutter
    ModalProps={{
      keepMounted: true,
    }}
    >
      <MemoizedDrawerContent
        patterns={props.patterns}
        onRemove={props.onRemove}
        selectPattern={props.selectPattern}
        onAdd={props.onAdd}
      />
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default React.memo(PatternDrawer);
