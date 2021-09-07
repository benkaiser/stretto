import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';
import Utilities from '../utilities';

export default class ArtistsFeed extends PlaylistView {
  constructor(props) {
    super(props);
    this._getArtistsFeed();
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
    } else if (!this._artistsFeedPlaylist) {
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
    /* no-op */
  }

  getColumns() {
    return ['title', 'artist', 'album', 'releaseDate'];
  }

  columnTitleMappings() {
    return {
      'title': 'Title',
      'artist': 'Artist',
      'album': 'Album',
      'releaseDate': 'Released'
    };
  }

  columnWidthMappings() {
    return {
      'title': 0.3,
      'artist': 0.25,
      'album': 0.25,
      'releaseDate': 0.2
    };
  }

  getPlaylistFromProps() {
    return this._artistsFeedPlaylist || new Playlist({
      title: 'Artists Feed',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div className='buttons'>
        <Link className='btn btn-primary' to='/artists/manage'>Manage Artists</Link>
        <Link className='btn btn-primary' to='/artists/add'>Artist Suggestions</Link>
      </div>
    );
  }

  @autobind
  _getArtistsFeed() {
    fetch('/artists/followed')
    .then(Utilities.fetchToJson)
    .then(results => {
      const songs = results.map(item => new Song(item));
      this._artistsFeedPlaylist = new Playlist({
        title: 'Artists Feed',
        rawSongs: songs
      });
      const state = this.determineStateForElementsToShow(0, window.innerHeight, this._artistsFeedPlaylist);
      this.setState({
        ...state,
        playlist: this._artistsFeedPlaylist
      });
    }).catch((error) => {
      console.log(error);
      this.setState({
        error: 'Please login to access your artists feed'
      });
    })
  }
}
