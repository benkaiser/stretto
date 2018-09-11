import * as React from 'react';
import { Link } from 'react-router-dom';
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
            <Link to='/' style={{ textDecoration: 'none' }}>Stretto</Link>
            <Link className='sidebar-icon' to='/settings/'><span className='glyphicon glyphicon-cog'></span></Link>
            <Link className='sidebar-icon' to='/add/'><span className='glyphicon glyphicon-plus'></span></Link>
            <Link className='sidebar-icon' to='/sync/'><span className='glyphicon glyphicon-refresh'></span></Link>
          </h3>
          <SearchBox />
          <ul className='nav nav-pills nav-stacked'>
            <li className='dropdown-header'>Add to Library</li>
            <li><Link to='/spotify/'>Import from Spotify</Link></li>
            <li><Link to='/import/'>Import from Stretto 1.x (JSON)</Link></li>
            <li className='dropdown-header'>Your Music</li>
            { Playlist.fetchAll().map((playlist) =>
              <li key={'playlist_' + playlist.title}>
                <Link to={'/playlist/' + playlist.title}>
                  { playlist.title }
                </Link>
              </li>
            ) }
            <li onClick={this.addNewPlaylist}><a href='#'>Add new playlist</a></li>
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
