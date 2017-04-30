import Song from './song';

let listeners = [];
let playlists = [];

class Playlist {
  static get LIBRARY() {
    return 'Library';
  }

  constructor(attrs) {
    this.createdAt = attrs.createdAt || +new Date();
    this.songs = attrs.songs || [];
    this.title = attrs.title || '';
    this.removable = attrs.title != Playlist.LIBRARY;
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
      removable: this.removable,
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

  static addOnChangeListener(listener) {
    listeners.push(listener);
  }

  static change() {
    listeners.forEach((listener) => {
      listener(playlists);
    });
  }

  static create(attrs) {
    attrs.songs = attrs.songs || [];
    attrs.createdAt = +(new Date());
    let newPlaylist = new Playlist(attrs);
    playlists.push(newPlaylist);
    Playlist.change();
    return newPlaylist;
  }

  static fetchAll() {
    return playlists;
  }

  static getByTitle(title) {
    return playlists.filter((playlist) => playlist.title === title)[0];
  }

  static initialise(initialData) {
    initialData.forEach((item) => {
      playlists.push(new Playlist(item));
    });
  }

  static isEmpty() {
    return playlists.length === 0;
  }

  static remove(playlist) {
    const index = playlists.indexOf(playlist);
    if (index < 0 || !playlists[index].removable) return;
    playlists.splice(index, 1);
    Playlist.change();
  }
}

module.exports = Playlist;
