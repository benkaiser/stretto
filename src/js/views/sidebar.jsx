import { h, Component } from 'preact';
import { Link } from 'react-router';
import PlayerControls from './player_controls';
import PlayerInfo from './player_info';
import Playlist from '../models/playlist';

class Sidebar extends Component {
  render() {
    return (
      <div class='sidebar'>
        <div class='sidebar-top'>
          <h3 class='logo'>
            <Link to='/' style={{ textDecoration: 'none' }}>Stretto</Link>
            <Link class='settings-button' to='/settings/'><span class='glyphicon glyphicon-cog' aria-hidden='true'></span></Link>
            <Link class='add-button' to='/add/'><span class='glyphicon glyphicon-plus' aria-hidden='true'></span></Link>
          </h3>
          <ul class='nav nav-pills nav-stacked'>
            <li class="dropdown-header">Find Music</li>
            <li><a href="#">Explore</a></li>
            <li class="dropdown-header">Your Music</li>
            { Playlist.fetchAll().map((playlist) =>
              <li>
                <Link to={'/playlist/' + playlist.url()}>
                  { playlist.title }
                </Link>
              </li>
            ) }
          </ul>
        </div>
        <div class='sidebar-bottom'>
          <PlayerControls />
          <PlayerInfo />
        </div>
      </div>
    );
  }
}

module.exports = Sidebar;
