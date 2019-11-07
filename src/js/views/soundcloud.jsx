import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert } from 'react-bootstrap';
import Youtube from '../services/youtube';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import * as SC from 'soundcloud';
import autobind from 'autobind-decorator';

export default class Soundcloud extends PlaylistView {
  constructor(props) {
    super(props);
    this._getSoundcloudStream();
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
    this._getSoundcloudStream();
  }
    

  getPlaylistFromProps() {
    return this._youtubePlaylist || new Playlist({
      title: 'Soundcloud Stream',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div>
      </div>
    );
  }

  @autobind
  _getSoundcloudStream() {
    // need a way to get the stream...
  }
}
