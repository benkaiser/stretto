import * as React from 'react';
import autobind from 'autobind-decorator';
import { Nav } from 'react-bootstrap';

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
          variant="tabs"
          justify
          activeKey={this.state.selected}
          onSelect={this._onSelect}
        >
          <Nav.Item>
            <Nav.Link eventKey={1} title="iTunes Charts">iTunes</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={2} title="Spotify Charts">Spotify</Nav.Link>
          </Nav.Item>
        </Nav>
        { this.state.selected === 1 ? <DiscoverItunes /> : <DiscoverSpotify /> }
      </div>
    );
  }

  @autobind
  _onSelect(selected) {
    this.setState({
      selected: Number(selected)
    });
  }
}
