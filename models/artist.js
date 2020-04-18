const mongoose = require('mongoose');

let ArtistModel;

module.exports = class Artist {
  static initialize() {
    ArtistModel = mongoose.model('artist', {
      email: String,
      artists: mongoose.Schema.Types.Mixed
    });
  }

  static getFollowedArtists(email) {
    return new Promise((resolve, reject) => {
      ArtistModel.findOne({ email: email }, (err, doc) => {
        if (err) { return reject(err); }
        if (!doc) { return resolve([]); }
        resolve(doc.artists);
      });
    });
  }

  static followArtist(email, artist) {
    return new Promise((resolve, reject) => {
      ArtistModel.findOne({ email: email }, (err, doc) => {
        let artists = [];
        if (doc && doc.artists) {
          if (doc.artists.findIndex((item) => item.artistId == artist.artistId) === -1) {
            artists = doc.artists.concat(artist);
          }
        } else {
          artists = [artist];
        }
        ArtistModel.findOneAndUpdate(
          { email: email },
          { email: email, artists: artists },
          { upsert: true },
        (err, result) => {
          if (err) { return reject(err); }
          resolve(result);
        });
      });
    });
  }

  static unfollowArtist(email, artist) {
    return new Promise((resolve, reject) => {
      ArtistModel.findOne({ email: email }, (err, doc) => {
        let artists = [];
        if (doc && doc.artists) {
          artists = doc.artists.filter((item) => item.artistId !== artist.artistId);
        }
        ArtistModel.findOneAndUpdate(
          { email: email },
          { email: email, artists: artists },
          { upsert: true },
        (err, result) => {
          if (err) { return reject(err); }
          resolve(result);
        });
      });
    });
  }
}
