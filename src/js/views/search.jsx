import * as React from 'react';
import { Button } from 'react-bootstrap';
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
      <div>
        <Button onClick={this._onCreatePlaylist}>Create Playlist from Selection</Button>
        <Button onClick={this._youtubeSearch}>Youtube Search</Button>
        <Button onClick={this._soundcloudSearch}>Soundcloud Search</Button>
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

  _onCreatePlaylist() {
    /* no-op */
  }

  _soundcloudSearch() {
    /* no-op */
  }

  _youtubeSearch() {
    /* no-op */
  }
}

module.exports = Search;
