import React from "react";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import TabitBar from "./TabitBar";
import ClearIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/Add';
import { isMobile } from "./common/Mobile";
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Tooltip from "./common/TabitTooltip";
import {arrayMove, useSortable, SortableContext, 
  verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { 
  DragOverlay,
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

const PatternListItem = (props) =>
{
  const {
    selectPattern,
    index,
    pattern,
    onRemove,
    dragEnabled
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
  return (
    <ListItem
    button
    key={"drawer-pattern" + index.toString()}
    onClick={selectCallback}
    dense
    secondaryAction={(!onRemove) ? undefined :
      <Tooltip
        title="Delete"
        show={props.showHelp}
      >
        <IconButton
          edge="end"
          size="small"
          onClick={removeCallback}
        >
          <ClearIcon 
            fontSize="small" 
          />
        </IconButton>
      </Tooltip>
    }
  >
      {dragEnabled &&
        <ListItemAvatar>
          <Tooltip
            title="Drag"
            show={props.showHelp}
          >
            <IconButton
              size="small"
              edge="end"
              {...props.dragListeners}
              {...props.dragAttributes}
              ref={props.dragSetActivatorNodeRef}
            >
              <DragHandleIcon fontSize="small"/>
            </IconButton>
          </Tooltip>
        </ListItemAvatar>
      }
      <ListItemText primary={pattern.name} />
    </ListItem>
  );
};

const DraggablePatternListItem = (props) =>
{
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <PatternListItem 
        selectPattern={props.selectPattern}
        index={props.index}
        pattern={props.pattern}
        onRemove={props.onRemove}
        dragListeners={listeners}
        dragAttributes={attributes}
        dragSetActivatorNodeRef={setActivatorNodeRef}
        dragEnabled={props.dragEnabled}
      />
    </div>
  );
};

const DNDSwitcher = (props) => {
  const {
    disabled,
    patterns,
    patternDisplayOrder,
    setPatternDisplayOrder,
    selectPattern,
    showHelp,
    onRemove
  } = props;
  const sensors = useSensors(
    useSensor(PointerSensor)
  );
  const [activeId, setActiveId] = React.useState(null);

  // patternDisplayOrder contains what pattern-index we'll actually show in each position
  const items = patternDisplayOrder.map( index => patterns[index] );
  const nameAndIndexArray = [...items.keys()].map(index => [items[index].name, index]);
  const patternNameToIndex = new Map (nameAndIndexArray);
  function handleDragStart(event) {
    const {active} = event;
    setActiveId(active.id);
  };
  function handleDragEnd(event) {
    const {active, over} = event;
    const itemNames = items.map(item => item.name);
    if (active && over && active.id !== over.id) {

      const oldIndex = itemNames.indexOf(active.id);
      const newIndex = itemNames.indexOf(over.id);
      setPatternDisplayOrder(
       arrayMove(patternDisplayOrder, oldIndex, newIndex)
      );
    }
    setActiveId(null);
  };
  if(disabled)
  {
    return <React.Fragment>
      {(items).map( (pattern, index) =>
        <DraggablePatternListItem
          pattern={pattern}
          key={pattern.name}
          id={pattern.name}
          index={index}
          onRemove={onRemove}
          selectPattern={selectPattern}
          showHelp={showHelp}
          dragEnabled={!disabled}
        />
      )}
    </React.Fragment>
  }
  else
  {
    return <DndContext
      sensors={sensors}
      // TODO: The swapping behaviour sucks a bit, I'm a little disappointed in this library
      // but I'll have to write a custom collision detection here
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {(items).map( (pattern, index) =>
          pattern.name === activeId ? <ListItem key={pattern.name} id={pattern.name}/> : <DraggablePatternListItem
            pattern={pattern}
            key={pattern.name}
            id={pattern.name}
            index={index}
            onRemove={onRemove}
            selectPattern={selectPattern}
            showHelp={showHelp}
            dragEnabled={!disabled}
          />
        )}
      </SortableContext>
      <DragOverlay>
        {activeId &&
          <PatternListItem
            selectPattern={props.selectPattern}
            index={patternNameToIndex.get(activeId)}
            pattern={items[patternNameToIndex.get(activeId)]}
            onRemove={props.onRemove}
            dragEnabled={!disabled}
          />
        }
      </DragOverlay>
    </DndContext>
  }
};

function DrawerContent(props)
{
  return (<React.Fragment>
    {!isMobile ? <TabitBar placeholder /> : null }
    <div>
      <List>
        <DNDSwitcher
          disabled={!props.setPatternDisplayOrder}
          patterns={props.patterns}
          patternDisplayOrder={props.patternDisplayOrder}
          setPatternDisplayOrder={props.setPatternDisplayOrder}
          selectPattern={props.selectPattern}
          showHelp={props.showHelp}
          onRemove={props.onRemove}
        />
        {props.onAdd &&
          <ListItem
            key={"drawer-add-button"}
            dense
            secondaryAction = {
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
                    // edge="end"
                    />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemText />
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
        showHelp={props.showHelp}
        patternDisplayOrder={props.patternDisplayOrder}
        setPatternDisplayOrder={props.setPatternDisplayOrder}
      />
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default React.memo(PatternDrawer);
