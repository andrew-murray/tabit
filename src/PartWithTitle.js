import React from 'react';
import Part from "./Part";
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
  root: {
    "margin-bottom": theme.spacing(2)
  },
});

function getTitleType(headingLevel, defaultLevel)
{
    const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const safeHeading = headingLevel ? headingLevel.toLowerCase() : '';
    const Title = validHeadingLevels.includes(safeHeading) ? safeHeading : defaultLevel;
    return Title;
}

class PartWithTitle extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const Title = getTitleType(this.props.headingLevel, "h4");
    return (
      <article>
        <Title>{this.props.instrumentName}</Title>
        <Part 
          instrument={this.props.instrument}
          tracks={this.props.tracks}
          config={this.props.config}
        />
      </article>
    );
  }
}

export default withStyles(useStyles)(PartWithTitle);