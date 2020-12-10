import * as React from 'react';
import { Button } from 'react-bootstrap';
import getHistory from 'react-router-global-history';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Utilities from '../utilities';
import Alerter from './alerter';
import autobind from 'autobind-decorator';

export default class SyncManager {
  static get _instance() {
    return SyncManager.__instance || (SyncManager.__instance = new SyncManager());
  }

  static startSync() {
    return this._instance._startSync();
  }

  constructor() {
    this._latestVersion = localStorage.getItem('latestVersion') || 0;
    this._latestVersion === 'undefined' && (this._latestVersion = 0);
  }

  @autobind
  _addListeners() {
    Song.addOnChangeListener(this._uploadTimeout, false);
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
    Alerter.success('Library Updated');
    getHistory().replace(window.location.pathname);
  }

  _startSync() {
    return this._getLatestVersionFromServer()
    .then(this._addListeners);
  }

  _updateLatestVersion(version) {
    this._latestVersion = version;
    localStorage.setItem('latestVersion', version);
    console.log(`updated version to ${version}`);
  }

  @autobind
  _uploadData(forceUpload) {
    const data = {
      playlists: Playlist.fetchAll(),
      songs: Song.fetchAll(),
      version: this._latestVersion,
    }
    return fetch('/uploaddata' + (forceUpload ? '?force=true' : ''), {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data)
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.success) {
        this._updateLatestVersion(data.version);
      } else if (data.error === 'version mismatch') {
        Alerter.error(<p>
          Sync failed version check.
          <Button onClick={() => {
            this._uploadData(true);
          }}>Force Upload</Button>
        </p>);
      }
    });
  }

  @autobind
  _uploadTimeout() {
    this._uploadTimeout && clearTimeout(this._uploadTimeout);
    this._uploadTimeout = setTimeout(this._uploadData, 5000);
  }
}
