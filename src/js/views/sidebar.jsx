import { h, Component } from 'preact';
import { Link } from 'react-router';
import Bootbox from '../services/bootbox';
import PlayerControls from './player_controls';
import PlayerInfo from './player_info';
import Playlist from '../models/playlist';
import autobind from 'autobind-decorator';

class Sidebar extends Component {
  constructor() {
    super();
    Playlist.addOnChangeListener(this.onPlaylistChange);
  }

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
                <Link to={'/playlist/' + playlist.title}>
                  { playlist.title }
                </Link>
              </li>
            ) }
            <li onClick={this.addNewPlaylist}><a href='#'>Add new playlist</a></li>
          </ul>
        </div>
        <div class='sidebar-bottom'>
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
