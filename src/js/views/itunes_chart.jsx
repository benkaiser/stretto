import * as React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import Spinner from 'react-spinkit';

import Itunes from '../services/itunes';
import Player from '../services/player';
import Playlist from '../models/playlist';

export default class ItunesChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
    this._fetchChart();
    this.isDisposed = false;
  }

  componentWillUnmount() {
    this.isDisposed = true;
  }

  render() {
    if (this.state.loaded) {
      return (
        <div>
          <ListGroup>
          { this.state.playlist.songData.map(item => 
            <ListGroupItem key={item.title} onClick={this._playSong.bind(this, item)}>
              <div className='chartInnerContainer'>
                <img className='chartImage' src={item.cover.replace(/600x600/, '50x50')} alt='cover art' />
                <div className='chartInformation'>
                  <h4 className='list-group-item-heading'>{item.title}</h4>
                  <p className='list-group-item-text'>{item.artist}</p>
                </div>
              </div>
            </ListGroupItem>
            )}
          </ListGroup>;
        </div>
      )
    } else {
      return <Spinner name='three-bounce' />;
    }
  }

  _fetchChart() {
    Itunes.fetchChart(this.props.chartOptions)
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
    });
  }

  _playSong(item) {
    Player.play(item, this.state.playlist);
  }
}