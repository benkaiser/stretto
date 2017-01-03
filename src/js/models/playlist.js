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

  decorate() {
    return {
      title: this.title,
      songs: this.songs
                 .map((songId) => Song.findById(songId))
                 .filter((song) => song !== undefined)
    };
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
