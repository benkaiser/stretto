import * as React from 'react';
import autobind from 'autobind-decorator';
import ContextMenu from './context_menu';
import Player from '../services/player';
import PlayerControls from './player_controls';
import Slider from './slider';

export default class PlayerControlsMobile extends PlayerControls {
  render() {
    return (
      <div className='mobilePlayerControls'>
        <Slider />
        <div className='control-buttons'>
          <div><i className='fa fa-4x fa-fast-backward' aria-hidden='true' onClick={Player.previous}></i></div>
          { (this.state.playing) ?
            <div><i className='fa fa-4x fa-pause' aria-hidden='true' onClick={this.togglePlaying}></i></div>
            :
            <div><i className='fa fa-4x fa-play' aria-hidden='true' onClick={this.togglePlaying}></i></div>
          }
          <div><i className='fa fa-4x fa-fast-forward' aria-hidden='true' onClick={Player.next}></i></div>
        </div>
        <div className='control-buttons secondary-controls'>
          <div>
            <i className={'fa fa-2x fa-retweet' + (this.state.repeat ? ' text-primary' : '')} aria-hidden='true' onClick={Player.toggleRepeat}></i>
            { this.state.repeat && <span className='badge control-badge'>1</span> }
          </div>
          <div><i className='fa fa-2x fa-ellipsis-v' aria-hidden='true' onClick={this._openContextMenu}></i></div>
          <div><i className={'fa fa-2x fa-random' + (this.state.shuffle ? ' text-primary' : '')} aria-hidden='true' onClick={Player.toggleShuffle}></i></div>
        </div>
      </div>
    );
  }

  @autobind
  _openContextMenu(event) {
    ContextMenu.open([Player.currentSong], event, undefined);
    event.preventDefault();
  }
}