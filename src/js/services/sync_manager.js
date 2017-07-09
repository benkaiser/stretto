import Playlist from '../models/playlist';
import Song from '../models/song';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

export default class SyncManager {
  static get _instance() {
    return SyncManager.__instance || (SyncManager.__instance = new SyncManager());
  }

  static startSync() {
    this._instance._startSync();
  }

  constructor() {
    this._latestVersion = localStorage.getItem('latestVersion') || 0;
    this._latestVersion === 'undefined' && (this._latestVersion = 0);
  }

  @autobind
  _addListeners() {
    Song.addOnChangeListener(this._uploadTimeout);
    Playlist.addOnChangeListener(this._uploadTimeout);
  }

  _getLatestData() {
    return fetch('/latestdata', { credentials: 'same-origin' })
    .then(Utilities.fetchToJson)
    .then((data) => {
      this._setLocalData(data.songs || [], data.playlists || []);
      this._updateLatestVersion(data.version);
    });
  }

  _getLatestVersionFromServer() {
    return fetch('/latestversion', { credentials: 'same-origin' })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.version === -1) {
        return this._uploadData();
      } else if(data.version > this._latestVersion) {
        return this._getLatestData();
      }
      return Promise.resolve();
    });
  }

  _setLocalData(songs, playlists) {
    console.log('updating local data...');
    Song.initialise(songs);
    Playlist.initialise(playlists);
    Song.change();
    Playlist.change();
  }

  _startSync() {
    this._getLatestVersionFromServer()
    .then(this._addListeners);
  }

  _updateLatestVersion(version) {
    this._latestVersion = version;
    localStorage.setItem('latestVersion', version);
    console.log(`updated version to ${version}`);
  }

  @autobind
  _uploadData() {
    const data = {
      playlists: Playlist.fetchAll(),
      songs: Song.fetchAll(),
      version: this._latestVersion,
    }
    return fetch('/uploaddata', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data)
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      data.success && this._updateLatestVersion(data.version);
    });
  }

  @autobind
  _uploadTimeout() {
    this._uploadTimeout && clearTimeout(this._uploadTimeout);
    this._uploadTimeout = setTimeout(this._uploadData, 5000);
  }
}
