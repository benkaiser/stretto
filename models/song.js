const mongoose = require('mongoose');

let SongModel;

module.exports = class Song {
  static initialize() {
    SongModel = mongoose.model('song', {
      email: String,
      songBlob: mongoose.Schema.Types.Mixed
    });
  }

  static getSongs(email) {
    return new Promise((resolve, reject) => {
      SongModel.findOne({ email: email }, (err, doc) => {
        if (err) { return reject(err); }
        if (!doc) { return reject('Doc isn\'t defined'); }
        resolve(doc.songBlob);
      });
    });
  }

  static updateSongs(email, songs) {
    return new Promise((resolve, reject) => {
      SongModel.findOneAndUpdate(
        { email: email },
        { email: email, songBlob: songs },
        { upsert: true },
      (err, doc) => {
        if (err) { return reject(err); }
        resolve(doc);
      });
    });
  }
}
