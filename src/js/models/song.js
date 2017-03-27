let listeners = [];
let songs = [];

class Song {
  constructor(attrs) {
    this.album = attrs.album || '';
    this.artist = attrs.artist || '';
    this.cover = attrs.cover || 'https://unsplash.it/g/512?random&' + attrs.id;
    this.createdAt = attrs.createdAt || +new Date();
    this.discNumber = attrs.discNumber || 0;
    this.duration = attrs.duration || 0;
    this.explicit = attrs.explicit || false;
    this.isSoundcloud = attrs.isSoundcloud || false;
    this.isYoutube = attrs.isYoutube || false;
    this.title = attrs.title || '';
    this.trackNumber = attrs.trackNumber || 0;
    this.url = attrs.url || '';
    this.year = attrs.year || new Date().getFullYear();
    this.updatedAt = attrs.updatedAt || +new Date();
    this.setId(attrs.id);
  }

  serialize() {
    return {
      album: this.album,
      artist: this.artist,
      cover: this.cover,
      createdAt: this.createdAt,
      discNumber: this.discNumber,
      duration: this.duration,
      explicit: this.explicit,
      id: this.id,
      isSoundcloud: this.isSoundcloud,
      isYoutube: this.isYoutube,
      title: this.title,
      trackNumber: this.trackNumber,
      updatedAt: this.updatedAt,
      url: this.url,
      year: this.year
    };
  }

  setId(id) {
    this.id = id;
    if (this.isYoutube && id.indexOf('y_') !== 0) {
      this.id = 'y_' + this.id;
    } else if (this.isSoundcloud && id.indexOf('s_') !== 0) {
      this.id = 's_' + this.id;
    }
  }

  get originalId() {
    return this.id.slice(2);
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
