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
import DragHandleIcon from '@mui/icons-material/DragHandle';
import Tooltip from "./TabitTooltip";
import {arrayMove, useSortable, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { 
  DragOverlay,
  DndContext, 
  closestCenter,
  KeyboardSensor,
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
  return (
    <ListItem
    button
    key={"drawer-pattern" + index.toString()}
    onClick={selectCallback}
  >
    <ListItemText primary={pattern.name} />
    {
      <ListItemSecondaryAction
        {...props.dragListeners}
        {...props.dragAttributes}
      >
        <Tooltip
          title="Drag"
          show={props.showHelp}
        >
          <IconButton
            edge="end"
            size="small"
          >
            <DragHandleIcon fontSize="small"/>
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    }
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
  );
};

const DraggablePatternListItem = (props) =>
{
  const {
    attributes,
    listeners,
    setNodeRef,
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
      />
    </div>
  );
};

function DrawerContent(props)
{
  const [activeId, setActiveId] = React.useState(null);
  const [items,setItems] = React.useState( props.patterns ?? [] );
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  function handleDragEnd(event) {
    console.log(event)
    const {active, over} = event;
    const itemNames = items.map(item => item.name);
    if (active.id !== over.id) {
      const oldIndex = itemNames.indexOf(active.id);
      const newIndex = itemNames.indexOf(over.id);
      setItems((items) => {        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  function handleDragStart(event) {
    const {active} = event;
    setActiveId(active.id);
  };
  const nameAndIndexArray = [...items.keys()].map(index => [items[index].name, index]);
  const patternNameToIndex = new Map (nameAndIndexArray);
  return (<React.Fragment>
    {!isMobile ? <TabitBar placeholder /> : null }
    <div
      style={{overflow: "auto"}}
    >
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {(items).map( (pattern, index) =>
              <DraggablePatternListItem
                pattern={pattern}
                key={pattern.name}
                id={pattern.name}
                index={index}
                onRemove={props.onRemove}
                selectPattern={props.selectPattern}
                showHelp={props.showHelp}
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
              />
            }
          </DragOverlay>
        </DndContext>
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
      </div>
    </div>
  </React.Fragment>
  );
}

const MemoizedDrawerContent = DrawerContent; // React.memo(DrawerContent);

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
        onReorderPatterns={props.onReorderPatterns}
      />
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default React.memo(PatternDrawer);
