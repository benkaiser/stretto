import * as React from 'react';
import { Button, Label } from 'react-bootstrap';
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

  getStateFromprops(props) {
    const state = super.getStateFromprops(props);
    state.includesNotInLibrary = false;
    return state;
  }

  getPlaylistFromProps(props) {
    this._needsPagination = false;
    this._paginationOffset = 0;
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
        { this.state.showLibrary
          ? <Button onClick={this._showLibrary.bind(this, false)} bsStyle='primary'>Include Songs Outside Library</Button>
          : <Button onClick={this._showLibrary.bind(this, true)} bsStyle='primary'>Show Library Only</Button> }
      </div>
    );
  }

  songsText() {
    if (this._localPlaylist) {
      const searchText = this.state.showLibrary ? 'Only showing library' : this.state.includesNotInLibrary ? 'Found more online' : 'Searching for more...';
      const count = this._localPlaylist.songs.length;
      return <p>{count} { count === 1 ? 'Song' : 'Songs' } in Library - {searchText}</p>;
    } else {
      return '';
    }
  }

  _showLibrary(showLibrary) {
    this.setState({
      showLibrary: showLibrary,
      playlist: this._localPlaylist
    }, () => {
      if (showLibrary) {
        this._mounted && this.setState(this.determineStateForElementsToShow(0, window.innerHeight, this.state.playlist));
      } else {
        this._itunesSearch();
      }
    });
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

  allowPagination() {
    return !this.state.showLibrary && this._needsPagination;
  }

  paginationCallback() {
    Itunes.search(this.props.match.params.search, this._paginationOffset).then(songs => {
      this._needsPagination = songs.length === 50;
      this._paginationOffset += songs.length;
      songs = songs.filter((song) =>
        !this.state.playlist.songData.some(localSong => localSong.title.toLowerCase() === song.title.toLowerCase() && localSong.artist.toLowerCase() === song.artist.toLowerCase())
      );
      const newPlaylist = new Playlist({
        title: this.state.playlist.title,
        rawSongs: this.state.playlist.songData.concat(songs)
      });
      const scrollContainer = this.contentContainer();
      const state = this.determineStateForElementsToShow(scrollContainer.scrollTop, window.innerHeight, newPlaylist);
      state.playlist = newPlaylist;
      state.includesNotInLibrary = true;
      this.setState(state);
    });
  }

  @autobind
  _itunesSearch() {
    if (this.state.showLibrary) {
      return;
    }
    Itunes.search(this.props.match.params.search).then(songs => {
      if (this.state.showLibrary) {
        return;
      }
      this._needsPagination = songs.length === 50;
      this._paginationOffset = 50;
      songs = songs.filter((song) =>
        !this._localPlaylist.songData.some(localSong => localSong.title.toLowerCase() === song.title.toLowerCase() && localSong.artist.toLowerCase() === song.artist.toLowerCase())
      );
      const newPlaylist = new Playlist({
        title: this._localPlaylist.title,
        rawSongs: this._localPlaylist.songData.concat(songs)
      });
      const scrollContainer = this.contentContainer();
      const state = this.determineStateForElementsToShow(scrollContainer.scrollTop, window.innerHeight, newPlaylist);
      state.playlist = newPlaylist;
      state.includesNotInLibrary = true;
      this.setState(state);
    });
  }
}