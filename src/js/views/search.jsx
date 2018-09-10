import { h, Component } from 'preact';
import Player from '../services/player';
import Playlist, { SortDirection } from '../models/playlist';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

class Search extends PlaylistView {
  getStateFromprops(props) {
    const playlist = this._createPlaylistForSearch(props.params.search);
    const state = this.determineStateForElementsToShow(0, window.innerHeight, playlist);
    state.sortColumn = playlist.sortColumn || undefined;
    state.sortDirection = playlist.sortDirection || SortDirection.NONE;
    state.playlist = playlist;
    return state;
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
}

module.exports = Search;
