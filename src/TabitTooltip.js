import Tooltip from '@mui/material/Tooltip';

export default function TabitTooltip(props)
{
  const defaultProps = {
    enterTouchDelay: 250,
    enterDelay: 250,
    describeChild: true
  };
  const resolvedProps = Object.assign(defaultProps, props);
  return <Tooltip  {...resolvedProps} />;
};

TabitTooltip.muiName = Tooltip.muiName;
