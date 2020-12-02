import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert } from 'react-bootstrap';
import Youtube from '../services/youtube';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

export default class YoutubeMix extends PlaylistView {
  constructor(props) {
    super(props);
    this._getYoutubePlaylist();
  }

  render() {
    if (this.state.error) {
      return (
        <div className='intro'>
          { this.header() }
          <Alert bsStyle='danger'>
            <strong>Oh snap!</strong> {this.state.error}
          </Alert>
        </div>
      );
    } else if (!this._youtubePlaylist) {
      return (
        <div className='intro'>
          { this.header() }
          <p>Loading songs...</p>
          <Spinner />
        </div>
      );
    } else {
      return super.render();
    }
  }

  componentWillReceiveProps(props) {
    this._youtubePlaylist = undefined;
    this.setState(this.getStateFromprops(props));
    this._getYoutubePlaylist();
  }


  getPlaylistFromProps() {
    return this._youtubePlaylist || new Playlist({
      title: 'Youtube Mix',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div className='buttons'>
      </div>
    );
  }

  @autobind
  _getYoutubePlaylist() {
    const [ videoId, playlistId ] = this.props.match.params.playlist.split('+');
    Youtube.getPlaylistAnonymous(videoId, playlistId)
    .then(mixPlaylist => {
      const songs = mixPlaylist.items.map(item => new Song(item));
      this._youtubePlaylist = new Playlist({
        title: 'Youtube Mix for: ' + mixPlaylist.title,
        rawSongs: songs
      });
      const state = this.determineStateForElementsToShow(0, window.innerHeight, this._youtubePlaylist);
      this.setState({
        ...state,
        playlist: this._youtubePlaylist
      });
    }).catch((error) => {
      console.log(error);
      this.setState({
        error: 'Unable to fetch playlist. Login with Google and try again'
      });
    })
  }
}
