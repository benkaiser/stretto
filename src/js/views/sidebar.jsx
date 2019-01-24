import * as React from 'react';
import { Link } from 'react-router-dom';
import { Label, Image } from 'react-bootstrap';
import Bootbox from '../services/bootbox';
import PlayerControls from './player_controls';
import PlayerInfo from './player_info';
import Playlist from '../models/playlist';
import SearchBox from './search_box';
import autobind from 'autobind-decorator';

class Sidebar extends React.Component {
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
            <Link className='sidebar-icon' to='/add/' title='Add song'><i className="fa fa-plus"></i></Link>
            <Link className='sidebar-icon' to='/sync/' title='Sync to Cloud'><i className="fa fa-refresh"></i></Link>
            <Link className='sidebar-icon' to='/spotify/' title='Import from Spotify'><i className="fa fa-spotify"></i></Link>
          </h3>
          <SearchBox />
          <ul className='nav nav-pills nav-stacked'>
            <li key='discover'><Link to='/discover'>Discover</Link></li>
            <li className='dropdown-header'>Your Music <Label className='addPlaylist' bsStyle="default" onClick={this.addNewPlaylist}>Add Playlist</Label></li>
            { Playlist.fetchAll().map((playlist) =>
              <li key={'playlist_' + playlist.title}>
                <Link to={'/playlist/' + playlist.title}>
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
}

module.exports = Sidebar;
