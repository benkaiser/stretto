const mongoose = require('mongoose');
const uuidv4 = require('uuid').v4;

let SharedPlaylistModel;

module.exports = class SharedPlaylist {
  static initialize() {
    SharedPlaylistModel = mongoose.model('shared_playlist', {
      guid: String,
      email: String,
      playlistBlob: mongoose.Schema.Types.Mixed
    });
  }

  static getPlaylist(guid) {
    return new Promise((resolve, reject) => {
      SharedPlaylistModel.findOne({ guid: guid }, (err, doc) => {
        if (err || !doc) { return reject(err); }
        resolve(doc.playlistBlob);
      });
    });
  }

  static uploadPlaylist(email, playlists) {
    const guid = uuidv4();
    return new Promise((resolve, reject) => {
      SharedPlaylistModel.create({
        guid: guid,
        email: email,
        playlistBlob: playlists
      }, (err, doc) => {
        if (err) { return reject(err); }
        resolve(doc.guid);
      });
    });
  }
}
