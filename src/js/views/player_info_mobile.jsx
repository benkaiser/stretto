import * as React from 'react';
import { withRouter } from 'react-router-dom'
import autobind from 'autobind-decorator';
import ContextMenu from './context_menu';
import Player from '../services/player';
import { PlayerInfo } from './player_info';

class PlayerInfoMobile extends PlayerInfo {
  render() {
    if (this.state.song) {
      return (
        <div
          className='playerinfo'
          onTouchStart={this._onTouchStart}
          onTouchEnd={this._onTouchEnd}
          onMouseDown={this._onTouchStart}
          onMouseUp={this._onTouchEnd}
        >
          <img onError={this.onCoverError} className='cover' crossOrigin='use-credentials' src={this.state.song.cover} />
          <div className='info'>
            <p className='title' title={this.state.song.title}>{this.state.song.title}</p>
            <p className='artist'>
              {this.state.song.artist}
              { " - " }
              {this.state.song.album}
            </p>
          </div>
        </div>
      );
    } else {
      return <div className='playerinfo noSong' />;
    }
  }

  @autobind
  _rightSongClick(event) {
    ContextMenu.open([this.state.song], event);
    event.preventDefault();
  }

  @autobind
  _onTouchStart(event) {
    this._touchStart = event.timeStamp;
  }

  @autobind
  _onTouchEnd(event) {
    if (event.button) {
      return;
    }
    if (event.timeStamp - this._touchStart > 300) {
      if (event.clientX === undefined) {
        event.clientX = event.changedTouches[0].clientX;
        event.clientY = event.changedTouches[0].clientY;
        event.persist();
      }
      this._rightSongClick(event);
    } else {
      this._playerView(event);
    }
  }

  _playerView() {
    this.props.history.push(`/player`);
    event.preventDefault();
  }
}

export default withRouter(PlayerInfoMobile);
