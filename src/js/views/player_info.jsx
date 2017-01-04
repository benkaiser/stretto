import { h, Component } from 'preact';
import Player from '../services/player.js';

class PlayerInfo extends Component {
  constructor(props) {
    super(props);
    Player.addOnSongChangeListener(this.newSong.bind(this));
  }

  newSong(song) {
    this.setState({
      song: song
    });
  }

  render() {
    if (this.state.song) {
      return (
        <div class='playerinfo'>
          <div class='info'>
            <p class='title' title={this.state.song.title}>{this.state.song.title}</p>
            <p class='artist'>{this.state.song.artist} - {this.state.song.album}</p>
          </div>
          <img class='cover' src={this.state.song.cover} />
        </div>
      );
    } else {
      return <div class='playerinfo' />;
    }
  }
}

module.exports = PlayerInfo;
