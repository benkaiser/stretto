import * as React from 'react';
import { Button } from 'react-bootstrap';
import Itunes from '../services/itunes';
import Player from '../services/player';
import Playlist, { SortDirection } from '../models/playlist';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

class Search extends PlaylistView {
  getStateFromprops(props) {
    const playlist = this._createPlaylistForSearch(props.match.params.search);
    const state = this.determineStateForElementsToShow(0, window.innerHeight, playlist);
    state.sortColumn = playlist.sortColumn || undefined;
    state.sortDirection = playlist.sortDirection || SortDirection.NONE;
    state.playlist = playlist;
    return state;
  }

  headerButtons() {
    return (
      <div className='buttons'>
        { /* <Button onClick={this._onCreatePlaylist} title="Create a playlist from these songs">Create Playlist</Button> */ }
        <Button onClick={this._itunesSearch} title="search iTunes, back with youtube tracks">Search iTunes</Button>
        { /* <Button onClick={this._youtubeSearch} title="search youtube directly"><i className='fa fa-youtube' aria-hidden='true'></i> Search Youtube</Button> */ }
        { /* <Button onClick={this._soundcloudSearch} title="search soundcloud directly"><i className='fa fa-soundcloud' aria-hidden='true'></i> Search SoundCloud</Button> */ }
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

module.exports = Search;
