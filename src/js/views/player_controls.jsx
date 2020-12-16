import * as React from 'react';
import autobind from 'autobind-decorator';
import Player from '../services/player';
import Slider from './slider';

export default class PlayerControls extends React.Component {
  constructor(props) {
    super(props);
    Player.addOnStateChangeListener(this.stateChange);
    this.state = {
      playing: Player.isPlaying(),
      repeat: Player.repeat_state === Player.REPEAT.ONE,
      shuffle: Player.shuffle_on
    };
  }

  componentWillUnmount() {
    this.disposed = true;
    Player.removeOnSongChangeListener(this.stateChange);
  }

  render() {
    return (
      <div className='mobilePlayerControls'>
        <Slider />
        <div className='control-buttons'>
          <div>
            <i className={'fa fa-2x fa-retweet' + (this.state.repeat ? ' text-primary' : '')} aria-hidden='true' onClick={Player.toggleRepeat}></i>
            { this.state.repeat && <span className='badge control-badge'>1</span> }
          </div>
          <div><i className='fa fa-2x fa-fast-backward' aria-hidden='true' onClick={Player.previous}></i></div>
          { (this.state.playing) ?
            <div><i className='fa fa-2x fa-pause' aria-hidden='true' onClick={this.togglePlaying}></i></div>
            :
            <div><i className='fa fa-2x fa-play' aria-hidden='true' onClick={this.togglePlaying}></i></div>
          }
          <div><i className='fa fa-2x fa-fast-forward' aria-hidden='true' onClick={Player.next}></i></div>
          <div><i className={'fa fa-2x fa-random' + (this.state.shuffle ? ' text-primary' : '')} aria-hidden='true' onClick={Player.toggleShuffle}></i></div>
        </div>
      </div>
    );
  }

  @autobind
  stateChange() {
    if (this.disposed) {
      return;
    }
    this.setState({
      playing: Player.isPlaying(),
      repeat: Player.repeat_state === Player.REPEAT.ONE,
      shuffle: Player.shuffle_on
    });
  }

  togglePlaying() {
    Player.togglePlaying();
  }
}