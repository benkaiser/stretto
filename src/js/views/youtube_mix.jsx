import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert, DropdownButton, MenuItem } from 'react-bootstrap';
import Alerter from '../services/alerter';
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
      title: 'Youtube Playlist: Loading...',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div>
        <DropdownButton id='playlist-dropdown' title='Options'>
          <MenuItem onClick={this.addToLibrary}>Add all Songs to Library</MenuItem>
          <MenuItem onClick={this.toStrettoPlaylist}>Create Stretto Playlist</MenuItem>
        </DropdownButton>
      </div>
    );
  }

  @autobind
  addToLibrary() {
    const nonDupedSongs = this._youtubePlaylist._rawSongs.filter(newSong => !Song.findById(newSong.id));
    const library = Playlist.getByTitle(Playlist.LIBRARY);
    nonDupedSongs.forEach(song => {
      const newSong = Song.create(song)
      library.addSong(newSong);
    });
  }

  @autobind
  toStrettoPlaylist() {
    this.addToLibrary();
    Playlist.create({
      title: this._youtubePlaylist.title,
      songs: this._youtubePlaylist._rawSongs.map(song => song.id)
    });
    Alerter.success(`Created playlist named ${this._youtubePlaylist.title}`);
  }

  @autobind
  _getYoutubePlaylist() {
    const videoId = this.props.match.params.playlist;
    const playlistId = 'RD' + videoId;
    Youtube.getPlaylistAnonymous(videoId, playlistId)
    .then(mixPlaylist => {
      const songs = mixPlaylist.items.map(item => new Song(item));
      this._youtubePlaylist = new Playlist({
        title: 'Youtube Playlist: ' + mixPlaylist.title,
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
        error: 'Unable to fetch playlist. Maybe the video is no longer available?'
      });
    })
  }
}
