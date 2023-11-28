import * as React from 'react';
import { withRouter } from 'react-router-dom'
import autobind from 'autobind-decorator';
import Alerter from '../services/alerter';
import Bootbox from '../services/bootbox';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Lyrics from '../services/lyrics';
import Player from '../services/player';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Youtube from '../services/youtube';
import SoundcloudDownloader from '../services/soundcloud_downloader';
import Utilities from '../utilities';

const DROPDOWN_MAX_HEIGHT = 400;
const DROPDOWN_MAX_WIDTH = 250;

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
    return (
      <div className={`dropdownContainer`} style={this.dropdownStyle()}>
        <ul className={`dropdown-menu ${this.openStyle()}`}>
          { this._options() }
        </ul>
      </div>
    );
  }

  _allInLibrary() {
    return this.state.items.every(item => item.inLibrary);
  }

  _hasLyrics() {
    return !!Lyrics.lyrics && Player.currentSong.id === this.state.items[0].id;
  }

  _options() {
    return this._allInLibrary() ? this._inLibraryMenuOptions() : this._importMenuOptions()
  }

  _inLibraryMenuOptions() {
    return [
          this.state.items.length === 1 && <MenuItem onClick={this.editDetails}>Edit track</MenuItem>,
          this.state.items.length === 1 && this._hasLyrics() && <MenuItem onClick={this._showLyrics}>Show Lyrics</MenuItem>,
          this.state.items.length === 1 && this.state.items[0].isYoutube && <MenuItem onClick={this._getMix}>Start YouTube Mix</MenuItem>,
          this.state.items.some(track => track.offline) && <MenuItem onClick={this._download}>Download</MenuItem>,
          this.state.items.length === 1 && helperExtensionId &&
            <MenuItem onClick={this._offline}>{this.state.items[0].offline ? 'Re-offline' : 'Make available offline'}</MenuItem>,
          <MenuItem onClick={this.onRemoveFromLibraryClick}>Remove from library</MenuItem>,
          this.state.playlist && this.state.playlist.editable &&
            <MenuItem onClick={this.onRemoveFromPlaylistClick}>Remove from playlist</MenuItem>,
          <MenuItem header>Add to playlist</MenuItem>,
    ].concat(this.playlists().map((playlist) =>
      <MenuItem key={'menuItem_' + playlist.title} onClick={this.onItemClick.bind(this, playlist)}>{ playlist.title }</MenuItem>
    ))
    .filter(option => !!option);
  }

  _importMenuOptions() {
    return [
        (this.state.items.length !== 1 || !this.state.items[0].inLibrary) && <MenuItem onClick={this.addToLibrary}>Add to library</MenuItem>,
        this.state.items.length === 1 && this.state.items[0].isYoutube && <MenuItem onClick={this._getMix}>Start YouTube Mix</MenuItem>
    ].filter(option => !!option);
  }

  dropdownHeight() {
    // the specific height of a cell
    return Math.min(this._options().length * 26, DROPDOWN_MAX_HEIGHT);
  }

  dropdownStyle() {
    let topDistance = '';
    let bottomDistance = '';
    let leftDistance = this.state.xPosition;
    if (this.dropup()) {
      bottomDistance = window.innerHeight - this.state.yPosition;
      if (this.state.yPosition - this.dropdownHeight() < 0) {
        bottomDistance = window.innerHeight - this.dropdownHeight();
      }
    } else {
      topDistance = this.state.yPosition;
      if (this.state.yPosition + this.dropdownHeight() > window.innerHeight) {
        topDistance = window.innerHeight - this.dropdownHeight();
      }
    }
    if (leftDistance + DROPDOWN_MAX_WIDTH > window.innerWidth) {
      leftDistance = window.innerWidth - DROPDOWN_MAX_WIDTH;
    }
    return {
      left: `${leftDistance}px`,
      top: topDistance ? `${topDistance}px` : topDistance,
      bottom: bottomDistance ? `${bottomDistance}px` : bottomDistance
    };
  }

  dropup() {
    return this.state.yPosition > window.innerHeight - this.dropdownHeight();
  }

  @autobind
  addToLibrary() {
    this.state.items.map(song => {
      (song.deferred ? song.getTrack() : Promise.resolve()).then(() => {
        const newSong = Song.create(song);
        if (Playlist.getByTitle(Playlist.LIBRARY).songs.indexOf(newSong.id) === -1) {
          Playlist.getByTitle(Playlist.LIBRARY).addSong(newSong);
          Alerter.success('Added "' + song.title + '" to Library');
        }
      });
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
    Bootbox.confirm('Are you sure you want to remove the selected songs?')
    .then(() => {
      this.state.items.map(song => {
        Playlist.fetchAll().map((playlist) => {
          playlist.removeSong(song);
        });
        Song.remove(song);
      });
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

  @autobind
  _download() {
    console.log();
    const downloadableItems = this.state.items.filter(item => item.offline);
    Utilities.downloadFiles(downloadableItems.map(item => ({
      url: '/offlineaudio/' + item.originalId,
      filename: item.title + ' - ' + item.artist + item.offlineExtension
    })));
    this.hide();
  }

  @autobind
  _getMix() {
    this.props.history.push(`/mix/${this.state.items[0].originalId}`);
    this.hide();
  }

  @autobind
  _offline() {
    if (this.state.items[0].isYoutube) {
      this.state.items[0].cacheOffline();
    } else if (this.state.items[0].isSoundcloud) {
      SoundcloudDownloader.download(this.state.items[0]);
    } else {
      Alerter.error('Cannot manually offline this track type');
    }
  }

  static open(items, event, playlist) {
    return ContextMenu._component.open(items, event, playlist);
  }

  static hide() {
    ContextMenu._component.hide();
  }
}

export default withRouter(ContextMenu);
