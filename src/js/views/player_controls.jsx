import { h, Component } from 'preact';
import Player from '../services/player.js';

class PlayerControls extends Component {
  constructor(props) {
    super(props);
    Player.addOnStateChangeListener(this.stateChange.bind(this));
    this.state = {
      playing: false
    };
  }

  stateChange() {
    this.setState({
      playing: Player.isPlaying()
    });
  }

  render() {
    return (
      <div>
        <div class='control-buttons'>
          <div><i class="fa fa-2x fa-retweet" aria-hidden="true"></i></div>
          <div><i class="fa fa-2x fa-fast-backward" aria-hidden="true"></i></div>
          { (this.state.playing) ?
            <div><i class="fa fa-2x fa-pause" aria-hidden="true" onClick={this.togglePlaying.bind(this)}></i></div>
            :
            <div><i class="fa fa-2x fa-play" aria-hidden="true" onClick={this.togglePlaying.bind(this)}></i></div>
          }
          <div><i class="fa fa-2x fa-fast-forward" aria-hidden="true"></i></div>
          <div><i class="fa fa-2x fa-random" aria-hidden="true"></i></div>
        </div>
      </div>
    );
  }

  togglePlaying() {
    Player.togglePlaying();
  }
}

module.exports = PlayerControls;
