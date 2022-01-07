import * as React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import autobind from 'autobind-decorator';

import ContextMenu from './context_menu';
import Player from '../services/player';
import Playlist from '../models/playlist';
import SpotifyAPI from '../services/spotify_api';

export default class SpotifyChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
    this._fetchChart(props);
    this.isDisposed = false;
  }

  componentWillUnmount() {
    this.isDisposed = true;
  }

  render() {
    if (this.state.loaded) {
      return (
        <div>
          <ListGroup onTouchMove={this._closeContextMenu}>
          { this.state.playlist.songData.map((item, index) =>
            <ListGroupItem key={index} onClick={this._playSong.bind(this, item)} onContextMenu={this._rightSongClick.bind(this, item)}>
              <div className='chartInnerContainer'>
                <img className='chartImage' src={item.cover} alt='cover art' />
                <div className='chartInformation'>
                  <h4 className='list-group-item-heading'>{item.title}</h4>
                  <p className='list-group-item-text'>{item.artist}</p>
                </div>
                <div className='chartExtraInfo'>
                  { item.explicit && <span class="label label-danger">E</span>}
                </div>
              </div>
            </ListGroupItem>
            )}
          </ListGroup>
        </div>
      )
    } else {
      return <Spinner name='three-bounce' />;
    }
  }

  @autobind
  _rightSongClick(song, event) {
    ContextMenu.open([song], event, Player.playlist);
    event.preventDefault();
  }

  @autobind
  _closeContextMenu() {
    ContextMenu.hide();
  }

  _fetchChart(props) {
    return SpotifyAPI.fetchChart(props.type)
    .then(results => {
      if (this.isDisposed) {
        return;
      }
      const playlist = new Playlist({
        title: `Top Chart`,
        rawSongs: results
      });
      this.setState({
        playlist: playlist,
        loaded: true
      });
      this._requestRealCovers(playlist);
    });
  }

  _playSong(item) {
    Player.play(item, this.state.playlist);
  }
}