import * as React from 'react';
import { Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import autobind from 'autobind-decorator';

import ContextMenu from './context_menu';
import Itunes from '../services/itunes';
import Player from '../services/player';
import Playlist from '../models/playlist';

export default class ItunesChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      loadedAll: false
    };
    this._fetchChart(props);
    this.isDisposed = false;
  }

  componentWillUnmount() {
    this.isDisposed = true;
  }

  componentWillReceiveProps(props) {
    this._fetchChart(props);
  }

  render() {
    if (this.state.loaded) {
      return (
        <div>
          <ListGroup>
          { this.state.playlist.songData.map((item, index) => 
            <ListGroupItem key={index} onClick={this._playSong.bind(this, item)} onContextMenu={this._rightSongClick.bind(this, item)}>
              <div className='chartInnerContainer'>
                <img className='chartImage' src={item.cover.replace(/600x600/, '50x50')} alt='cover art' />
                <div className='chartInformation'>
                  <h4 className='list-group-item-heading'>{item.title}</h4>
                  <p className='list-group-item-text'>{item.artist}</p>
                </div>
              </div>
            </ListGroupItem>
            )}
          </ListGroup>
          { !this.state.loadedAll && 
            <Button bsStyle="primary" block onClick={this._loadMore}>
              Load All
            </Button>
          }
        </div>
      )
    } else {
      return <Spinner name='three-bounce' />;
    }
  }

  @autobind
  _loadMore() {
    this._fetchChart(this.props, true);
  }

  @autobind
  _rightSongClick(song, event) {
    ContextMenu.open([song], event, Player.playlist);
    event.preventDefault();
  }

  _fetchChart(props, loadAll) {
    Itunes.fetchChart({
      ...props.chartOptions,
      limit: loadAll ? 200 : 20
    })
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
        loaded: true,
        loadedAll: loadAll
      });
    });
  }

  _playSong(item) {
    Player.play(item, this.state.playlist);
  }
}