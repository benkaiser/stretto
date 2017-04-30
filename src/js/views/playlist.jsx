import { h, Component } from 'preact';
import Bootbox from '../services/Bootbox';
import Player from '../services/player';
import Playlist from '../models/playlist';
import autobind from 'autobind-decorator';
import bsn from 'bootstrap.native';

class PlaylistView extends Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromprops(props);
    Player.addOnSongChangeListener(this.songChange);
  }

  componentWillReceiveProps(props) {
    this.setState(this.getStateFromprops(props));
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
              <button type="button" class="btn btn-default dropdown-toggle" onclick={this.onOptions}>
                Options <span class="caret"></span>
              </button>
              <ul class="dropdown-menu">
                <li><a href="#" onClick={this.onDelete}>Delete playlist</a></li>
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
                  onClick={this.clickSong.bind(this, song)}>
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
  songChange() {
    this.setState();
  }
}

module.exports = PlaylistView;
