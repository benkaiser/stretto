import * as React from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Label, MenuItem } from 'react-bootstrap';
import getHistory from 'react-router-global-history';
import Bootbox from '../services/bootbox';
import FilterMenu from './filter_menu';
import PlayerControls from './player_controls';
import PlayerInfo from './player_info';
import Playlist from '../models/playlist';
import SearchBox from './search_box';
import autobind from 'autobind-decorator';

export default class Sidebar extends React.Component {
  constructor() {
    super();
    Playlist.addOnChangeListener(this.onPlaylistChange);
  }

  render() {
    return (
      <div className='sidebar'>
        <div className='sidebar-top'>
          <h3 className='logo'>
            <Link to='/' className='logoText'>Stretto</Link>
            <Link className='sidebar-icon' to='/settings/' title='Settings'><i className="fa fa-cog"></i></Link>
            <FilterMenu id='dropdown-import-sidebar' />
            <Dropdown title='Add music' className='pull-right' id={`dropdown-import-sidebar`} onSelect={this._onSelect}>
              <Dropdown.Toggle bsStyle='link'>
                <i className="fa fa-plus"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu className='dropdown-sidebar-menu'>
                <MenuItem eventKey="/spotify">From Spotify</MenuItem>
                <MenuItem eventKey="/add">From YouTube/Soundcloud/Audius</MenuItem>
                <MenuItem eventKey="/discover">From Top Charts</MenuItem>
              </Dropdown.Menu>
            </Dropdown>
            <Link className='sidebar-icon' to='/sync/' title='Sync to Cloud'><i className="fa fa-refresh"></i></Link>
          </h3>
          <SearchBox />
          <ul className='nav nav-pills nav-stacked'>
            {/* Soundcloud doesn't work currently, remove from sidebar */}
            {/* <li key='soundcloud'><Link to='/soundcloud'>Soundcloud</Link></li> */}
            <li key='discover'><Link to='/discover'>Top Charts</Link></li>
            <li key='artists'><Link to='/artists/manage'>Artists</Link></li>
            <li className='dropdown-header'>Your Music <Label className='addPlaylist' bsStyle="default" onClick={this.addNewPlaylist}>Add Playlist</Label></li>
            { Playlist.fetchAll().map((playlist) =>
              <li key={'playlist_' + playlist.title}>
                <Link to={'/playlist/' + encodeURIComponent(playlist.title)}>
                  { playlist.title }
                </Link>
              </li>
            ) }
          </ul>
        </div>
        <div className='sidebar-bottom'>
          <PlayerControls />
          <PlayerInfo />
        </div>
      </div>
    );
  }

  addNewPlaylist() {
    Bootbox.prompt('What do you want the new playlist title to be?').then((name) => {
      Playlist.create({
        title: name
      });
    });
  }

  @autobind
  onPlaylistChange() {
    this.setState({});
  }

  @autobind
  _onSelect(url) {
    getHistory().push(url);
  }
}
