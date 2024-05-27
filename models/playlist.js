const mongoose = require('mongoose');

let PlaylistModel;

module.exports = class Playlist {
  static initialize() {
    PlaylistModel = mongoose.model('playlist', {
      email: String,
      playlistBlob: mongoose.Schema.Types.Mixed
    });
  }

  static getPlaylists(email) {
    return new Promise((resolve, reject) => {
      PlaylistModel.findOne({ email: email }, (err, doc) => {
        if (err || !doc) { return reject(err); }
        if (doc.playlistBlob) {
          resolve(doc.playlistBlob.map(playlist => {
            return {
              ...playlist,
              // ensure this is never sent to the user
              _songData: undefined
            };
          }));
        } else {
          resolve([]);
        }
      });
    });
  }

  static updatePlaylists(email, playlists) {
    return new Promise((resolve, reject) => {
      PlaylistModel.findOneAndUpdate(
        { email: email },
        { email: email, playlistBlob: playlists.map(playlist => ({ ...playlist, _songData: undefined })) },
        { upsert: true },
      (err, doc) => {
        if (err) { return reject(err); }
        resolve(doc);
      });
    });
  }
}
