var versionMap = {};
var playlistsMap = {};
var songsMap = {};
const Playlist = require('./playlist');
const SharedPlaylists = require('./shared_playlist');
const Song = require('./song');
const Artist = require('./artist');
const User = require('./user');
const mongoose = require('mongoose');

module.exports = class DataMapper {
  static initialize(dbUrl) {
    mongoose.connect(dbUrl, function() {
      Artist.initialize();
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

  static getTopArtists(user, howMany) {
    return Song.getSongs(user.email)
    .then(songs => {
      const artistLookup = {};
      songs.forEach(song => {
        if (song && song.artist) {
          if (artistLookup[song.artist]) {
            artistLookup[song.artist]++;
          } else {
            artistLookup[song.artist] = 1;
          }
        }
      });
      delete artistLookup['Unknown'];
      const artistArray = Object.keys(artistLookup).map(key => {
        return {
          artist: key,
          count: artistLookup[key]
        };
      });
      artistArray.sort((a, b) => a.count > b.count ? -1 : 1);
      return artistArray.slice(0, howMany);
    });
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

  static followArtist(artist, user) {
    return Artist.followArtist(user.email, artist);
  }

  static sharePlaylist(playlistData, user) {
    return SharedPlaylists.uploadPlaylist(user.email, playlistData);
  }

  static getPlaylist(guid) {
    return SharedPlaylists.getPlaylist(guid);
  }
}
