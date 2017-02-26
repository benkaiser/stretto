import Song from './song';

let listeners = [];
let playlists = [];

class Playlist {
  constructor(attrs) {
    this.createdAt = attrs.createdAt || +new Date();
    this.title = attrs.title || '';
    this.songs = attrs.songs || [];
    this.updatedAt = attrs.updatedAt || +new Date();
  }

  addSong(song) {
    this.songs.push(song.id);
    delete this._songData;
    Playlist.change();
  }

  indexOf(song) {
    return this.songs.indexOf(song.id);
  }

  serialize() {
    return {
      createdAt: this.createdAt,
      title: this.title,
      songs: this.songs,
      updatedAt: this.updatedAt
    };
  }

  get songData() {
    if (!this._songData) {
      this._songData = this.songs
                           .map((songId) => Song.findById(songId))
                           .filter((song) => song !== undefined);
    }
    return this._songData;
  }

  url() {
    return encodeURIComponent(this.title);
  }

  static addOnChangeListener(listener) {
    listeners.push(listener);
  }

  static change() {
    listeners.forEach((listener) => {
      listener(playlists);
    });
  }

  static create(attrs) {
    let newPlaylist = new Playlist(attrs);
    playlists.push(newPlaylist);
    Playlist.change();
    return newPlaylist;
  }

  static fetchAll() {
    return playlists;
  }

  static getByUrl(url) {
    return playlists.filter((playlist) => playlist.url() === url)[0];
  }

  static initialise(initialData) {
    initialData.forEach((item) => {
      playlists.push(new Playlist(item));
    });
  }

  static isEmpty() {
    return playlists.length === 0;
  }
}

module.exports = Playlist;
