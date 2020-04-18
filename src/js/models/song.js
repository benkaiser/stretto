import Youtube from '../services/youtube';

let listeners = [];
let songs = [];

export default class Song {
  constructor(attrs) {
    this.album = attrs.album || '';
    this.artist = attrs.artist || '';
    this.cover = attrs.cover || 'https://unsplash.it/g/512?random&' + (attrs.id || 'title=' + attrs.title);
    this.createdAt = attrs.createdAt || +new Date();
    this.deferred = attrs.deferred || false;
    this.discNumber = attrs.discNumber || 0;
    this.duration = attrs.duration || 0;
    this.explicit = attrs.explicit || false;
    this.isSoundcloud = attrs.isSoundcloud || false;
    this.isYoutube = attrs.isYoutube || false;
    this.title = attrs.title || '';
    this.trackNumber = attrs.trackNumber || 0;
    this.url = attrs.url || '';
    this.spotifyId = attrs.spotifyId;
    this.year = attrs.year || new Date().getFullYear();
    this.updatedAt = attrs.updatedAt || +new Date();
    this.releaseDate = attrs.releaseDate;
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
      year: this.year,
      releaseDate: this.releaseDate
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

  getTrack() {
    return Youtube.search(`${this.title} ${this.artist} lyrics`, { maxResults: 1 }).then(([youtubeItem]) => {
      if (!youtubeItem) { throw new Error('Unable to find youtube matches'); }
      this.deferred = undefined;
      this.duration = youtubeItem.duration;
      this.id = 'y_' + youtubeItem.id;
      this.isYoutube = true;
      return this;
    });
  }

  get originalId() {
    return this.id.slice(2);
  }

  get inLibrary() {
    return !!Song.findById(this.id);
  }

  get allinfo() {
    return (this.title + ' ' + this.artist + ' ' + this.album).toLowerCase();
  }

  static addOnChangeListener(listener) {
    listeners.push(listener);
  }

  static change() {
    listeners.forEach((listener) => {
      listener instanceof Function && listener(songs);
    });
  }

  static create(attrs) {
    let newSong = new Song(attrs);
    let oldSong = Song.findById(newSong.id);
    if (oldSong) { return oldSong; }
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
    songs = [];
    initialData.forEach((item) => {
      songs.push(new Song(item));
    });
  }

  static remove(song) {
    let index = songs.indexOf(song);
    if (index === -1) { return; }
    songs.splice(index, 1);
    Song.change();
  }
}