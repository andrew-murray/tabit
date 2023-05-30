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
import { DndProvider } from 'react-dnd'
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'

const PatternListItem = (props) =>
{
  const ref = React.useRef(null)
  const [{ handlerId }, drop] = useDrop({
    accept: "pattern",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      if(props.onReorderPatterns)
      {
        // Time to actually perform the action
        props.onReorderPatterns(dragIndex, hoverIndex)
      }
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    }
  });
  const [{ isDragging }, drag] = useDrag({
    type: "pattern",
    item: () => {
      return { id: props.id, index: props.index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  const opacity = 1; // isDragging ? 0 : 1;
  if(props.onReorderPatterns)
  {
    drag(drop(ref));
  }
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
  const style = props.onReorderPatterns ? {opacity, margin:4, background: '#002d6b', "box-shadow": "1px 1px 1px 1px #000000"}
    : {opacity, margin:4};
  return (<div
    key={"drawer-pattern" + index.toString()}
    ref={ref}
    data-handler-id={handlerId}
    style={style}
  >
  <ListItem
    onClick={selectCallback}
    button
    disableRipple
  >
    <ListItemText primary={pattern.name} />
    {onRemove &&
      <ListItemSecondaryAction>
        <Tooltip
          title="Delete"
          show={props.showHelp}
        >
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

    </div>
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
            showHelp={props.showHelp}
            onReorderPatterns={props.onReorderPatterns}
          />
        )}
        {props.onAdd &&
          <ListItem
            key={"drawer-add-button"}
          >
            <ListItemText />
            <ListItemSecondaryAction>
              <Tooltip
                title="Add new pattern"
                show={props.showHelp}
              >
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
      <DndProvider backend={HTML5Backend}>
      <MemoizedDrawerContent
        patterns={props.patterns}
        onRemove={props.onRemove}
        selectPattern={props.selectPattern}
        onAdd={props.onAdd}
        showHelp={props.showHelp}
        onReorderPatterns={props.onReorderPatterns}
      />
      </DndProvider>
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default React.memo(PatternDrawer);
