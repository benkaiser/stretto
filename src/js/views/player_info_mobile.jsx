import * as React from 'react';
import { withRouter } from 'react-router-dom'
import ContextMenu from './context_menu';
import Player from '../services/player';
import autobind from 'autobind-decorator';

class PlayerInfoMobile extends React.Component {
  constructor(props) {
    super(props);
    Player.addOnSongChangeListener(this.newSong);
    this.state = {
      song: Player.currentSong
    };
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
        <div
          className='playerinfo'
          onTouchStart={this._onTouchStart}
          onTouchEnd={this._onTouchEnd}
          onMouseDown={this._onTouchStart}
          onMouseUp={this._onTouchEnd}
        >
          <div className='cover' style={{'backgroundImage': `url('${this.state.song.cover}')`}}></div>
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
      return <div className='playerinfo' />;
    }
  }

  @autobind
  _rightSongClick(event) {
    ContextMenu.open([this.state.song], event, Player.playlist);
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
      // this._showSongView(song);
    }
  }

  _search(searchText, event) {
    this.props.history.push(`/search/${searchText}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}

export default withRouter(PlayerInfoMobile);
