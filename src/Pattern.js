import React from 'react';

class Pattern extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    let partList = [];
    console.log(this.props);
    for( const e of this.props.parts ) {
      const name = e[0];
      const track = e[1];
      partList.push(
          <li key={name}>
            <h2>{name}</h2>
            <p>{track.rep}</p>
          </li>
      );
    }
    return (
      <div className="Pattern">
        <ul>
          {partList}
        </ul>
      </div>
    );
  }
}

export default Pattern;