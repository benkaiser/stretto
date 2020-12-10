import * as React from 'react';
import { Label } from 'react-bootstrap';
import Itunes from '../services/itunes';
import Playlist from '../models/playlist';
import PlaylistView from './playlist';
import MobileOnly from './mobile_only';
import SearchBox from './search_box';
import autobind from 'autobind-decorator';

const ITUNES_SEARCH_DELAY = 300;

export default class Search extends PlaylistView {
  playlistHeaderClass() {
    return super.playlistHeaderClass() + ' search_header';
  }

  getPlaylistFromProps(props) {
    if (props.match.params.search) {
      this._localPlaylist = this._createPlaylistForSearch(props.match.params.search);
      if (props.match.params.search.length > 3) {
        this._searchTimeout && clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(this._itunesSearch, ITUNES_SEARCH_DELAY);
      }
      return this._localPlaylist;
    } else {
      return new Playlist({
        title: 'Enter a Search',
        songs: []
      });
    }
  }

  extraTitleDecoration(song) {
    return (
      <>
        { song.inLibrary && (
          <div className='lyric-label'>
            <Label bsStyle="success">In Library</Label>
          </div>
        ) }
      </>
    )
  }

  headerButtons() {
    return (
      <div className='buttons'>
        <MobileOnly><SearchBox /></MobileOnly>
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
      songs = songs.filter((song) =>
        !this._localPlaylist.songData.some(localSong => localSong.title.toLowerCase() === song.title.toLowerCase() && localSong.artist.toLowerCase() === song.artist.toLowerCase())
      );
      const newPlaylist = new Playlist({
        title: this._localPlaylist.title,
        rawSongs: this._localPlaylist.songData.concat(songs)
      });
      const state = this.determineStateForElementsToShow(0, window.innerHeight, newPlaylist);
      state.playlist = newPlaylist;
      this.setState(state);
    });
  }
}