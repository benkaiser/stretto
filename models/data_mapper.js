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

  static createAccount(email, password) {
    return User.createAccount(email, password);
  }

  static createAccountForGoogleUser(email, googleObject) {
    return User.createAccountForGoogleUser(email, googleObject);
  }

  static loginUser(email, password) {
    return User.login(email, password);
  }

  static getUser(email) {
    return User.getUser(email);
  }

  static getPasswordResetForUser(email) {
    return User.getPasswordResetForUser(email);
  }

  static completePasswordReset(email, password, token) {
    return User.completePasswordReset(email, password, token);
  }

  static getVersionForUser(user) {
    return User.getVersionForUser(user);
  }

  static getFollowedArtists(user) {
    return Artist.getFollowedArtists(user.email);
  }

  static getTopArtists(user, artistsToFilterOut, howMany, atLeastXSongs) {
    atLeastXSongs = atLeastXSongs || 0;
    const filterLookup = artistsToFilterOut.map(artist => artist.artistName.toLowerCase());
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
      let artistArray = Object.keys(artistLookup).map(key => {
        return {
          artist: key,
          lowerCase: key.toLowerCase(),
          count: artistLookup[key]
        };
      });
      artistArray.sort((a, b) => a.count > b.count ? -1 : 1);
      artistArray = artistArray.filter(artist => filterLookup.indexOf(artist.lowerCase) === -1);
      return artistArray.slice(0, howMany).filter(artist => artist.count > atLeastXSongs);
    });
  }

  static setPublicJsonLibrary(user, isPublic) {
    return User.setPublicJsonLibrary(user, isPublic);
  }

  static isUserJsonLibraryPublic(email) {
    return User.isPublicJsonLibrary(email);
  }

  static setDataForUser(data, user, force) {
    return User.getVersionForUser(user)
    .then((version) => {
      if (force || data.version == version || version === -1) {
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

  static unfollowArtist(artist, user) {
    return Artist.unfollowArtist(user.email, artist);

  }

  static sharePlaylist(playlistData, user) {
    return SharedPlaylists.uploadPlaylist(user.email, playlistData);
  }

  static getPlaylist(guid) {
    return SharedPlaylists.getPlaylist(guid);
  }
}
