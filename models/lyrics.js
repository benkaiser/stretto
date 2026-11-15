const mongoose = require('mongoose');

let LyricsModel;

// Non-user-specific cache keyed by song id (e.g. y_<videoId>). Only successful lookups are stored.
module.exports = class Lyrics {
  static initialize() {
    LyricsModel = mongoose.model('lyrics', {
      songId: { type: String, index: { unique: true } },
      plainLyrics: String,
      syncedLyrics: String,
      match: String,
      createdAt: { type: Date, default: Date.now }
    });
  }

  static get(songId) {
    return LyricsModel.findOne({ songId }).lean().exec();
  }

  static save(songId, { plainLyrics, syncedLyrics, match }) {
    return LyricsModel.findOneAndUpdate(
      { songId },
      { songId, plainLyrics, syncedLyrics, match },
      { upsert: true, new: true }
    ).exec();
  }
}
