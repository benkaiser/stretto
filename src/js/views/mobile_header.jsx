import * as React from 'react';
import { Button, Dropdown, Nav, Navbar, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import getHistory from 'react-router-global-history';
import autobind from 'autobind-decorator';
import Playlist from '../models/playlist';
import FilterMenu from './filter_menu';

export default class MobileHeader extends React.Component {
  render() {
    return (
      <Navbar collapseOnSelect fixedTop>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to='/playlist/Library' className='logoText'>Stretto</Link>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-nav' />
          <FilterMenu navbar />
        </Navbar.Header>
        <Navbar.Collapse id='basic-nav'>
          <Nav onSelect={this._onSelect}>
            <NavItem eventKey='/search/'>Search</NavItem>
            <NavItem eventKey={`/playlist/${Playlist.LIBRARY}`}>{ Playlist.LIBRARY }</NavItem>
            <NavDropdown title='Playlists' id='basic-nav-dropdown' onSelect={this._onSelect}>
              { Playlist.fetchAll().filter(playlist => playlist.title !== Playlist.LIBRARY).map((playlist) =>
                <MenuItem key={'playlist_' + playlist.title} eventKey={'/playlist/' + encodeURIComponent(playlist.title)}>
                  { playlist.title }
                </MenuItem>
              ) }
              <MenuItem divider />
            </NavDropdown>
            <NavDropdown title='Add from' id='add-from-dropdown' onSelect={this._onSelect}>
                <MenuItem eventKey='/add'>From Youtube/Soundcloud</MenuItem>
                <MenuItem eventKey='/discover'>From Top Charts</MenuItem>
                <MenuItem eventKey='/spotify'>From Spotify</MenuItem>
            </NavDropdown>
            <NavItem eventKey='/soundcloud'>Soundcloud</NavItem>
            <NavItem eventKey='/artists/feed'>Artists Feed</NavItem>
            <NavItem eventKey='/sync/'>Sync</NavItem>
            <NavItem eventKey='/settings/'>Settings</NavItem>
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