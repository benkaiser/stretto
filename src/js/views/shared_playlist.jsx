import * as React from 'react';
import { Alert, DropdownButton, MenuItem } from 'react-bootstrap';

import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

export default class SharedPlaylist extends PlaylistView {
  constructor(props) {
    super(props);
  }

  get _playlist() {
    return env.playlist;
  }

  render() {
    if (!this._playlist) {
      return (
        <div className='intro'>
          { this.header() }
          <Alert bsStyle='danger'>
            <strong>Oh snap!</strong> We weren't able to fetch the shared playlist for you.
          </Alert>
        </div>
      );
    } else {
      return super.render();
    }
  }

  componentWillReceiveProps(props) {
    this._youtubePlaylist = undefined;
    this.setState(this.getStateFromprops(props));
  }

  getPlaylistFromProps() {
    return this._youtubePlaylist || new Playlist({
      title: this._playlist.title,
      rawSongs: this._playlist.rawSongs.map(song => new Song(song))
    });
  }

  headerButtons() {
    return (
      <div>
        <DropdownButton id='playlist-dropdown' title='Options'>
          <MenuItem onClick={this.addToLibrary}>Add to Library</MenuItem>
        </DropdownButton>
      </div>
    );
  }

  @autobind
  addToLibrary() {
    const nonDupedSongs = this._playlist.rawSongs.filter(newSong => !Song.findById(newSong.id));
    const library = Playlist.getByTitle(Playlist.LIBRARY);
    nonDupedSongs.forEach(song => {
      const newSong = Song.create(song)
      library.addSong(newSong);
    });
    Playlist.create({
      title: this._playlist.title,
      songs: this._playlist.rawSongs.map(song => song.id)
    });
  }
}
