import { h, Component } from 'preact';
import Player from '../services/player.js';
import autobind from 'autobind-decorator';

class PlayerInfo extends Component {
  constructor(props) {
    super(props);
    Player.addOnSongChangeListener(this.newSong);
    this.state = {
      hideCover: false,
      song: Player.currentSong
    };
  }

  hideCover(hide) {
    this.setState({hideCover: hide});
    return false;
  }

  @autobind
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
          { (!this.state.hideCover) ?
          <div class='cover-wrapper'>
            <div class='cover' style={`background-image: url('${this.state.song.cover}')`}></div>
            <div key='hide' class='btn btn-default btn-sm hide-button' onClick={this.hideCover.bind(this, true)}>
              <i class='fa fa-angle-down' aria-hidden='true'></i>
            </div>
          </div>
          : <div key='show' class='btn btn-default btn-xs show-button' onClick={this.hideCover.bind(this, false)}>
              <i class='fa fa-angle-up' aria-hidden='true'></i>
            </div>
          }
        </div>
      );
    } else {
      return <div class='playerinfo' />;
    }
  }
}

module.exports = PlayerInfo;
