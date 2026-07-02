import * as React from 'react';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import getHistory from 'react-router-global-history';
import autobind from 'autobind-decorator';
import Playlist from '../models/playlist';
import FilterMenu from './filter_menu';

export default class MobileHeader extends React.Component {
  render() {
    return (
      <Navbar collapseOnSelect fixed='top' expand={false}>
        <Navbar.Brand>
          <Link to='/home' className='logoText'>Stretto</Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls='basic-nav' />
        <FilterMenu navbar />
        <Navbar.Collapse id='basic-nav'>
          <Nav onSelect={this._onSelect}>
            <Nav.Link eventKey='/search/'>Search</Nav.Link>
            <Nav.Link eventKey={`/playlist/${Playlist.LIBRARY}`}>{ Playlist.LIBRARY }</Nav.Link>
            <NavDropdown title='Playlists' id='basic-nav-dropdown'>
              { Playlist.fetchAll().filter(playlist => playlist.title !== Playlist.LIBRARY).map((playlist) =>
                <NavDropdown.Item key={'playlist_' + playlist.title} eventKey={'/playlist/' + encodeURIComponent(playlist.title)}>
                  { playlist.title }
                </NavDropdown.Item>
              ) }
              <NavDropdown.Divider />
            </NavDropdown>
            <NavDropdown title='Add from' id='add-from-dropdown'>
                <NavDropdown.Item eventKey='/add'>From Youtube/Soundcloud</NavDropdown.Item>
                <NavDropdown.Item eventKey='/discover'>From Top Charts</NavDropdown.Item>
                <NavDropdown.Item eventKey='/spotify'>From Spotify</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link eventKey='/soundcloud'>Soundcloud</Nav.Link>
            <Nav.Link eventKey='/artists/feed'>Artists Feed</Nav.Link>
            <Nav.Link eventKey='/sync/'>Sync</Nav.Link>
            <Nav.Link eventKey='/settings/'>Settings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }

  @autobind
  _onSelect(url) {
    getHistory().push(url);
  }
}
