import { Component, h } from 'preact';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Playlist from '../models/playlist';
import Song from '../models/song';
import autobind from 'autobind-decorator';

const DROPDOWN_HEIGHT = 400;

export default class ContextMenu extends Component {
  constructor() {
    super();
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
    return (
      <div className={`dropdownContainer`} style={this.dropdownStyle()}>
        <ul className={`dropdown-menu ${this.openStyle()}`}>
          <MenuItem onClick={this.onRemoveFromLibraryClick}>Remove from library</MenuItem>
          { this.state.playlist && this.state.playlist.editable &&
            <MenuItem onClick={this.onRemoveFromPlaylistClick}>Remove from playlist</MenuItem>
          }
          <MenuItem header>Add to playlist</MenuItem>
          { this.playlists().map((playlist) =>
            <MenuItem onClick={this.onItemClick.bind(this, playlist)}>{ playlist.title }</MenuItem>
          ) }
        </ul>
      </div>
    );
  }

  dropdownStyle() {
    const yPosition = this.dropup() ? this.state.yPosition - DROPDOWN_HEIGHT : this.state.yPosition;
    return `left: ${this.state.xPosition}px; top: ${yPosition}px;`;
  }

  dropup() {
    return this.state.yPosition > window.innerHeight - DROPDOWN_HEIGHT;
  }

  @autobind
  hide() {
    this.setState({
      open: false
    });
  }

  onItemClick(playlist) {
    playlist.addSong(this.state.song);
    this.hide();
  }

  @autobind
  onRemoveFromLibraryClick() {
    Playlist.fetchAll().map((playlist) => {
      playlist.removeSong(this.state.song);
    });
    Song.remove(this.state.song);
    this.hide();
  }

  @autobind
  onRemoveFromPlaylistClick() {
    this.state.playlist.removeSong(this.state.song);
    this.hide();
  }

  open(song, event, playlist) {
    this.setState({
      open: true,
      playlist: playlist,
      song: song,
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

  static open(song, event, playlist) {
    return ContextMenu._component.open(song, event, playlist);
  }
}
