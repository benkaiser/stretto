import * as React from 'react';
import { withRouter } from 'react-router-dom'
import Bootbox from '../services/bootbox';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Lyrics from '../services/lyrics';
import Player from '../services/player';
import Playlist from '../models/playlist';
import Song from '../models/song';
import autobind from 'autobind-decorator';

const DROPDOWN_HEIGHT = 400;

class ContextMenu extends React.Component {
  constructor(props) {
    super(props);
    ContextMenu._component = this;
    this.state = {
      open: false,
      xPosition: 0,
      yPosition: 0
    };
  }

  componentDidMount() {
    this.rootElement().addEventListener('click', this.hide);
  }

  componentWillUnmount() {
    this.rootElement().removeEventListener('click', this.hide);
  }

  render() {
    if (!this.state.items || !this.state.items[0]) {
      return null;
    }
    return this._allInLibrary() ? this._inLibraryMenu() : this._importMenu();
  }

  _allInLibrary() {
    return this.state.items.every(item => item.inLibrary);
  }

  _hasLyrics() {
    return !!Lyrics.lyrics && Player.currentSong.id === this.state.items[0].id;
  }

  _inLibraryMenu() {
    return (
      <div className={`dropdownContainer`} style={this.dropdownStyle()}>
        <ul className={`dropdown-menu ${this.openStyle()}`}>
          { this.state.items.length === 1 && <MenuItem onClick={this.editDetails}>Edit track</MenuItem> }
          { this.state.items.length === 1 && this._hasLyrics() && <MenuItem onClick={this._showLyrics}>Show Lyrics</MenuItem>}
          <MenuItem onClick={this.onRemoveFromLibraryClick}>Remove from library</MenuItem>
          { this.state.playlist && this.state.playlist.editable &&
            <MenuItem onClick={this.onRemoveFromPlaylistClick}>Remove from playlist</MenuItem>
          }
          <MenuItem header>Add to playlist</MenuItem>
          { this.playlists().map((playlist) =>
            <MenuItem key={'menuItem_' + playlist.title} onClick={this.onItemClick.bind(this, playlist)}>{ playlist.title }</MenuItem>
          ) }
        </ul>
      </div>
    );
  }

  _importMenu() {
    return (
      <div className={`dropdownContainer`} style={this.dropdownStyle()}>
        <ul className={`dropdown-menu ${this.openStyle()}`}>
          <MenuItem onClick={this.addToLibrary}>Add to library</MenuItem>
        </ul>
      </div>
    );
  }

  dropdownStyle() {
    const yPosition = this.dropup() ? this.state.yPosition - DROPDOWN_HEIGHT : this.state.yPosition;
    return {
      left: `${this.state.xPosition}px`,
      top: `${yPosition}px`
    };
  }

  dropup() {
    return this.state.yPosition > window.innerHeight - DROPDOWN_HEIGHT;
  }

  @autobind
  addToLibrary() {
    this.state.items.map(song => {
      const newSong = Song.create(song);
      Playlist.getByTitle(Playlist.LIBRARY).addSong(newSong);
    });
  }

  @autobind
  editDetails() {
    window.lastRoute = this.props.history.location.pathname;
    this.props.history.push('/edit/' + this.state.items[0].id);
  }

  @autobind
  hide() {
    if (this.state.open) {
      this.setState({
        open: false
      });
      return false;
    }
  }

  onItemClick(playlist) {
    this.state.items.map(song => {
      playlist.addSong(song);
    });
    this.hide();
  }

  @autobind
  onRemoveFromLibraryClick() {
    this.state.items.map(song => {
      Playlist.fetchAll().map((playlist) => {
        playlist.removeSong(song);
      });
      Song.remove(song);
    });
    this.hide();
  }

  @autobind
  onRemoveFromPlaylistClick() {
    this.state.items.map(song => {
      this.state.playlist.removeSong(song);
    });
    this.hide();
  }

  open(items, event, playlist) {
    this.setState({
      open: true,
      playlist: playlist,
      items: items,
      xPosition: event.clientX,
      yPosition: event.clientY
    });
  }

  openStyle() {
    return this.state.open ? 'open' : '';
  }

  playlists() {
    return Playlist.fetchAll().filter((playlist) => {
      if (!this.state.playlist) return true;
      return playlist !== this.state.playlist && playlist.editable;
    });
  }

  rootElement() {
    try {
      return document.getElementsByClassName('root')[0];
    } catch (error) {
      console.log('errored!');
      return document.body;
    }
  }

  @autobind
  _showLyrics() {
    Lyrics.show();
    this.hide();
  }

  static open(items, event, playlist) {
    return ContextMenu._component.open(items, event, playlist);
  }
}

export default withRouter(ContextMenu);
