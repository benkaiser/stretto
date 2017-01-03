const shortid = require('shortid');

let listeners = [];
let songs = [];

class Song {
  constructor(attrs) {
    this.title = attrs.title || '';
    this.artist = attrs.artist || '';
    this.album = attrs.album || '';
    this.cover = attrs.cover || 'https://unsplash.it/g/512?random&' + attrs.id;
    this.createdAt = attrs.createdAt || +new Date();
    this.discNumber = attrs.discNumber || 0;
    this.explicit = attrs.explicit || false;
    this.isYoutube = attrs.isYoutube || false;
    this.updatedAt = attrs.updatedAt || +new Date();
    this.soundcloudId = attrs.isSoundcloud || false;
    this.trackNumber = attrs.trackNumber || 0;
    this.setId(attrs.id);
  }

  setId(id) {
    this.id = id;
    if (this.isYoutube && id.indexOf('y_') !== 0) {
      this.id = 'y_' + this.id;
    } else if (this.isSoundcloud && id.indexOf('s_') !== 0) {
      this.id = 's_' + this.id;
    }
  }

  static addOnChangeListener(listener) {
    listeners.push(listener);
  }

  static change() {
    listeners.forEach((listener) => {
      listener(songs);
    });
  }

  static create(attrs) {
    let newSong = new Song(attrs);
    songs.push(newSong);
    Song.change();
    return newSong;
  }

  static fetchAll() {
    return songs;
  }

  static findById(songId) {
    return this.fetchAll().filter((song) => song.id === songId)[0];
  }

  static initialise(initialData) {
    initialData.forEach((item) => {
      songs.push(new Song(item));
    });
  }
}

module.exports = Song;
