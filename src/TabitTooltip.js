import Tooltip from '@mui/material/Tooltip';
import React from "react";



export default function TabitTooltip(props)
{
  const defaultProps = {
    enterTouchDelay: 250,
    enterDelay: 250,
    describeChild: true
  };
  const resolvedProps = Object.assign(defaultProps, props);
  if(props.show)
  {
    return <Tooltip open={true} {...resolvedProps} />;
  }
  else
  {
    return <React.Fragment>{resolvedProps.children}</React.Fragment>
  }
};

TabitTooltip.muiName = Tooltip.muiName;
