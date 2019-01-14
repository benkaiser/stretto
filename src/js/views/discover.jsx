import * as React from 'react';
import autobind from 'autobind-decorator';
import { Nav, NavItem } from 'react-bootstrap';

import DiscoverItunes from './discover_itunes';
import DiscoverSpotify from './discover_spotify';

export default class Discover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: 1
    };
  }

  render() {
    return (
      <div className='intro'>
        <Nav
          bsStyle="tabs"
          justified
          activeKey={this.state.selected}
          onSelect={this._onSelect}
        >
          <NavItem eventKey={1} title="iTunes Charts">iTunes</NavItem>
          <NavItem eventKey={2} title="Spotify Charts">Spotify</NavItem>
        </Nav>
        { this.state.selected === 1 ? <DiscoverItunes /> : <DiscoverSpotify /> }
      </div>
    );
  }

  @autobind
  _onSelect(selected) {
    this.setState({
      selected
    });
  }
}