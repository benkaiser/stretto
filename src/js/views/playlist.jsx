import { h, Component } from 'preact';
import Player from '../services/player.js';
import Playlist from '../models/playlist';

class PlaylistView extends Component {
  constructor(props) {
    super(props);
    this.playlist = Playlist.getByUrl(props.params.playlist);
  }

  render() {
    let currentSong = Player.currentSong();
    let currentSongId = (currentSong) ? currentSong.id : '';
    return (
      <div class='intro'>
        <h1>{this.playlist.title}</h1>
        <p>{this.playlist.songs.length} Songs</p>
        <table class='song-table table table-hover'>
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Album</th>
            </tr>
          </thead>
          <tbody>
            { this.playlist.songData.map((song) =>
              <tr class={ (currentSongId == song.id) ? 'active' : '' }
                  onClick={this.clickSong.bind(this, song)}>
                <td>
                  <img class='cover' src={song.cover} />
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
    Player.play(song);
    this.setState({});
  }
}

module.exports = PlaylistView;
