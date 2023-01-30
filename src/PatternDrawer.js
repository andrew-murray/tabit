import React from "react";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import TabitBar from "./TabitBar";
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { isMobile } from "./Mobile";
import Tooltip from "./TabitTooltip";

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
        <Tooltip title="Delete">
          <IconButton
            edge="end"
            size="small"
            onClick={removeCallback}
          >
            <ClearIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
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
              <Tooltip title="Add new pattern">
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
              </Tooltip>
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
