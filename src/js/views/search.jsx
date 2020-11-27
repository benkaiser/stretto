import * as React from 'react';
import { Button } from 'react-bootstrap';
import Itunes from '../services/itunes';
import Player from '../services/player';
import Playlist from '../models/playlist';
import PlaylistView from './playlist';
import MobileOnly from './mobile_only';
import SearchBox from './search_box';
import autobind from 'autobind-decorator';

export default class Search extends PlaylistView {
  playlistHeaderClass() {
    return super.playlistHeaderClass() + ' search_header';
  }

  getPlaylistFromProps(props) {
    if (props.match.params.search) {
      return this._createPlaylistForSearch(props.match.params.search);
    } else {
      return new Playlist({
        title: 'Enter a Search',
        songs: []
      });
    }
  }

  headerButtons() {
    return (
      <div className='buttons'>
        <MobileOnly><SearchBox /></MobileOnly>
        <Button onClick={this._itunesSearch} title="search iTunes, back with youtube tracks" block>Search iTunes</Button>
      </div>
    );
  }

  _createPlaylistForSearch(searchTerm) {
    const parts = searchTerm.toLowerCase().split(' ');
    const library = Playlist.getByTitle(Playlist.LIBRARY);
    const matchingSongs = library.songData.filter(song => parts.every(part => song.allinfo.indexOf(part) >= 0)).map(song => song.id);
    return new Playlist({
      title: `Search results for "${searchTerm}"`,
      songs: matchingSongs
    });
  }

  @autobind
  _itunesSearch() {
    Itunes.search(this.props.match.params.search).then(songs => {
      const newPlaylist = this.state.playlist;
      newPlaylist.rawSongs = songs;
      const state = this.determineStateForElementsToShow(0, window.innerHeight, newPlaylist);
      state.playlist = newPlaylist;
      this.setState(state);
    });
  }

  @autobind
  _onCreatePlaylist() {
    /* no-op */
  }

  @autobind
  _soundcloudSearch() {
    /* no-op */
  }

  @autobind
  _youtubeSearch() {
    /* no-op */
  }
}