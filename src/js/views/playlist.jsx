import { h, Component } from 'preact';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';
import Player from '../services/player';
import Playlist from '../models/playlist';
import autobind from 'autobind-decorator';
import bsn from 'bootstrap.native';

class PlaylistView extends Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromprops(props);
    Player.addOnSongChangeListener(this.songChange);
    Playlist.addOnChangeListener(this.songChange);
  }

  componentDidMount() {
    this.optionsButton && delete this.optionsButton['Dropdown'];
  }

  componentWillReceiveProps(props) {
    this.setState(this.getStateFromprops(props));
    this.optionsButton && delete this.optionsButton['Dropdown'];
  }

  componentWillUnmount() {
    Player.removeOnSongChangeListener(this.songChange);
  }

  render() {
    let currentSong = Player.currentSong;
    let currentSongId = (currentSong) ? currentSong.id : '';
    return (
      <div class='intro'>
        <div class='playlist_header'>
          <h1>{this.state.playlist.title}</h1>
          { this.state.playlist.removable &&
            <div class="btn-group">
              <button type="button" class="btn btn-default dropdown-toggle" onclick={this.onOptions} ref={(button) => this.optionsButton = button}>
                Options <span class="caret"></span>
              </button>
              <ul class="dropdown-menu">
                <li><a href="#" onClick={this.onDelete}>Delete playlist</a></li>
                <li><a href="#" onClick={this.onRename}>Rename playlist</a></li>
              </ul>
            </div>
          }
        </div>
        <p>{this.state.playlist.songs.length} Songs</p>
        <table class='song-table table table-hover'>
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Album</th>
            </tr>
          </thead>
          <tbody>
            { this.state.playlist.songData.map((song) =>
              <tr class={ (currentSongId == song.id) ? 'active' : '' }
                  onClick={this.clickSong.bind(this, song)}
                  onContextMenu={this.rightClickSong.bind(this, song)}>
                <td>
                  <div class='cover' style={`background-image: url('${song.cover}')`}></div>
                  {song.title}
                </td>
                <td>{song.artist}</td>
                <td>{song.album}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  clickSong(song) {
    Player.play(song, this.state.playlist);
    this.setState();
  }

  getStateFromprops(props) {
    return {
      playlist: Playlist.getByTitle(props.params.playlist)
    };
  }

  @autobind
  onDelete() {
    Bootbox.confirm('Are you sure you want to delete this playlist?').then(() => {
      Playlist.remove(this.state.playlist);
      this.props.router.push('/playlist/' + Playlist.LIBRARY);
    });
  }

  @autobind
  onOptions(event) {
    new bsn.Dropdown(event.target);
  }

  @autobind
  onRename() {
    Bootbox.prompt('What would you like to rename your playlist to?', {
      value: this.state.playlist.title
    }).then((newTitle) => {
      this.state.playlist.update('title', newTitle);
      this.props.router.push('/playlist/' + newTitle);
    });
  }

  rightClickSong(song, event) {
    ContextMenu.open(song, event, this.state.playlist);
    event.preventDefault();
  }

  @autobind
  songChange() {
    this.setState();
  }
}

module.exports = PlaylistView;
