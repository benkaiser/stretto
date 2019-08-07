var versionMap = {};
var playlistsMap = {};
var songsMap = {};
const Playlist = require('./playlist');
const SharedPlaylists = require('./shared_playlist');
const Song = require('./song');
const User = require('./user');
const mongoose = require('mongoose');

module.exports = class DataMapper {
  static initialize(dbUrl) {
    mongoose.connect(dbUrl, function() {
      Song.initialize();
      Playlist.initialize();
      User.initialize();
      SharedPlaylists.initialize();
    });
  }

  static getDataForUser(user) {
    return Promise.all([
      Playlist.getPlaylists(user.email),
      Song.getSongs(user.email),
      User.getVersionForUser(user)
    ]).then((values) => {
      return {
        playlists: values[0],
        songs: values[1],
        version: values[2]
      };
    })
  }

  static getVersionForUser(user) {
    return User.getVersionForUser(user);
  }

  static setDataForUser(data, user) {
    return User.getVersionForUser(user)
    .then((version) => {
      if (data.version == version || version === -1) {
        return Promise.all([
          Playlist.updatePlaylists(user.email, data.playlists),
          Song.updateSongs(user.email, data.songs)
        ]).then(() => {
          return User.bumpVersionForUser(user);
        });
      }
      return Promise.reject('version mismatch');
    });
  }

  static sharePlaylist(playlistData, user) {
    return SharedPlaylists.uploadPlaylist(user.email, playlistData);
  }

  static getPlaylist(guid) {
    return SharedPlaylists.getPlaylist(guid);
  }
}
