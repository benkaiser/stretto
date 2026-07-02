import * as React from 'react';
import { Alert, DropdownButton, Dropdown } from 'react-bootstrap';

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
          <Alert variant='danger'>
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
          <Dropdown.Item onClick={this.addToLibrary}>Add to Library</Dropdown.Item>
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
