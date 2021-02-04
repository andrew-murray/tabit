import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import TabitBar from "./TabitBar";

function PatternDrawer(props)
{
  const iOS = props.iOS;
  const mobile = props.mobile;

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
            </ListItem>
          ))}
        </List>
      </div>
    </SwipeableDrawer>
  );
};

// open, onOpen, onClose, patterns, selectPattern

export default PatternDrawer;