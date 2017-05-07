import Song from './song';
import autobind from 'autobind-decorator';

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
    this.editable = attrs.title != Playlist.LIBRARY;
    this.updatedAt = attrs.updatedAt || +new Date();
  }

  addSong(song) {
    if (this.songs.indexOf(song.id) > -1) { return; }
    this.songs.push(song.id);
    delete this._songData;
    Playlist.change();
  }

  ensureShuffleReady() {
    if (!this._shuffleData || this.songData.length != this._shuffleData.length) {
      this._shuffleData = this.songData.slice();
      for (let x = 0; x < this._shuffleData.length; x++) {
        let temp = this._shuffleData[x];
        let newIndex = Math.floor(Math.random() * this._shuffleData.length);
        this._shuffleData[x] = this._shuffleData[newIndex];
        this._shuffleData[newIndex] = temp;
      }
    }
  }

  findByOffset(song, offset, list, indexFunc) {
    let newIndex = (indexFunc(song) + offset) % list.length;
    return list[newIndex < 0 ? list.length + newIndex : newIndex];
  }

  findNextSong(song) {
    return this.findByOffset(song, 1, this.songData, this.songIndex);
  }

  findNextSongInShuffle(song) {
    this.ensureShuffleReady();
    return this.findByOffset(song, 1, this._shuffleData, this.shuffleIndex);
  }

  findPreviousSong(song) {
    return this.findByOffset(song, -1, this.songData, this.songIndex);
  }

  findPreviousSongInShuffle(song) {
    this.ensureShuffleReady();
    return this.findByOffset(song, -1, this._shuffleData, this.shuffleIndex);
  }

  nextSong(song, isShuffled) {
    return isShuffled ? this.findNextSongInShuffle(song) : this.findNextSong(song);
  }

  previousSong(song, isShuffled) {
    return isShuffled ? this.findPreviousSongInShuffle(song) : this.findPreviousSong(song);
  }

  removeSong(song) {
    let index = this.songs.indexOf(song.id);
    if (index === -1) { return; }
    this.songs.splice(index, 1);
    delete this._songData;
    Playlist.change();
  }

  serialize() {
    return {
      createdAt: this.createdAt,
      title: this.title,
      editable: this.editable,
      songs: this.songs,
      updatedAt: this.updatedAt
    };
  }

  @autobind
  shuffleIndex(song) {
    return this._shuffleData.indexOf(song);
  }

  @autobind
  songIndex(song) {
    return this.songs.indexOf(song.id);
  }

  update(attribute, value) {
    this[attribute] = value;
    Playlist.change();
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
    if (index < 0 || !playlists[index].editable) return;
    playlists.splice(index, 1);
    Playlist.change();
  }

  static removeOnChangeListener(listener) {
    listeners.splice(listeners.indexOf(listener), 1);
  }
}

module.exports = Playlist;
