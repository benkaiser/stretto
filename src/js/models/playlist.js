import Song from './song';
import autobind from 'autobind-decorator';

let listeners = [];
let playlists = [];

const SortDirection = {
  NONE: 0,
  ASCENDING: 1,
  DESCENDING: 2
}

export { SortDirection };

export default class Playlist {
  static get LIBRARY() {
    return 'Library';
  }

  constructor(attrs) {
    this.createdAt = attrs.createdAt || +new Date();
    this.songs = attrs.songs || [];
    this.title = attrs.title || '';
    this.editable = attrs.title != Playlist.LIBRARY;
    if (attrs.editable !== undefined) {
      this.editable = attrs.editable;
    }
    this.updatedAt = attrs.updatedAt || +new Date();
    if (attrs.title === Playlist.LIBRARY) {
      this.sortBy('createdAt', SortDirection.DESCENDING);
    }
    if (attrs.rawSongs) {
      this.rawSongs = attrs.rawSongs;
    }
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
    let nextSong = isShuffled ? this.findNextSongInShuffle(song) : this.findNextSong(song);
    // logic to skip over songs that are marked as not playing in library, only used if there are some songs marked as able to play
    // to avoid an infinite loop.
    if (this.title === Playlist.LIBRARY && this.songData.some(song => song.playInLibrary === true)) {
      while (nextSong.playInLibrary === false) {
        nextSong = isShuffled ? this.findNextSongInShuffle(nextSong) : this.findNextSong(nextSong);
      }
    }
    return nextSong;
  }

  previousSong(song, isShuffled) {
    let previousSong = isShuffled ? this.findPreviousSongInShuffle(song) : this.findPreviousSong(song);
    // logic to skip over songs that are marked as not playing in library, only used if there are some songs marked as able to play
    // to avoid an infinite loop.
    if (this.title === Playlist.LIBRARY && this.songData.some(song => song.playInLibrary === true)) {
      while (previousSong.playInLibrary === false) {
        previousSong = isShuffled ? this.findPreviousSongInShuffle(previousSong) : this.findPreviousSong(previousSong);
      }
    }
    return previousSong;
  }

  removeSong(song) {
    let index = this.songs.indexOf(song.id);
    if (index === -1) { return; }
    this.songs.splice(index, 1);
    delete this._songData;
    Playlist.change();
  }

  reorder(oldIndex, newIndex) {
    let [item] = this.songs.splice(oldIndex, 1);
    this.songs.splice(newIndex, 0, item);
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
    return this.songData.indexOf(song);
  }

  sortBy(column, direction) {
    this._sortColumn = column;
    this._sortDirection = direction;
    delete this._songData;
  }

  @autobind
  sortSongs(firstSong, secondSong) {
    if (firstSong[this._sortColumn] === secondSong[this._sortColumn]) return 0;
    switch (this._sortDirection) {
      case SortDirection.ASCENDING:
        return (firstSong[this._sortColumn] < secondSong[this._sortColumn]) ? -1 : 1;
      case SortDirection.DESCENDING:
        return (firstSong[this._sortColumn] > secondSong[this._sortColumn]) ? -1 : 1;
      case SortDirection.NONE:
      default:
        return 0;
    }
  }

  update(attribute, value) {
    this[attribute] = value;
    Playlist.change();
  }

  _getSongs() {
    return this._rawSongs ||
      (this.songs
        .map((songId) => Song.findById(songId))
        .filter((song) => song !== undefined)
        .filter((song) => localStorage.getItem('offlineOnly') === 'true' ? song.offline : true)
        .filter((song) => localStorage.getItem('cleanOnly') === 'true' ? !song.explicit : true)
     );
  }

  _getCacheKey() {
    const offline = localStorage.getItem('offlineOnly');
    const cleanOnly = localStorage.getItem('cleanOnly');
    if (offline === 'true') {
      return cleanOnly + '-' + offline + '-' + Song.offlineSongIds().join(',');
    } else {
      return cleanOnly + offline;
    }
  }

  exportShare() {
    return {
      title: this.title,
      rawSongs: this._getSongs().map(song => song.serialize())
    }
  }

  get songData() {
    if (!this._songData || this._cacheKey !== this._getCacheKey()) {
      this._cacheKey = this._getCacheKey();
      this._songData = this._getSongs();
      if (this._sortColumn && this._sortDirection !== SortDirection.NONE) {
        this._songData = this._songData.sort(this.sortSongs);
      }
    }
    return this._songData;
  }

  get sortColumn() {
    return this._sortColumn;
  }

  get sortDirection() {
    return this._sortDirection;
  }

  set rawSongs(songs) {
    this._rawSongs = songs;
    this.songs = songs.map(song => song.id);
    delete this._songData;
  }

  static addOnChangeListener(listener) {
    listeners.push(listener);
  }

  static change() {
    listeners.forEach((listener) => {
      listener instanceof Function && listener(playlists);
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
    return playlists.sort(Playlist._sortFunction);
  }

  static getByTitle(title) {
    return playlists.filter((playlist) => playlist.title === title)[0];
  }

  static getOrCreateByTitle(title) {
    return this.getByTitle(title) || this.create({ title: title });
  }

  static initialise(initialData) {
    playlists = [];
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
    if (listeners.indexOf(listener) > -1) {
      listeners.splice(listeners.indexOf(listener), 1);
    }
  }

  /**
   * TODO: use GUID for ids so this ugly hack isn't needed
   */
  static updateIds(oldId, newId) {
    playlists.forEach((playlist) => {
      const index = playlist.songs.indexOf(oldId);
      if (index > -1) {
        playlist.songs[index] = newId;
        delete playlist._songData;
      }
    });
    Playlist.change();
  }

  static _sortFunction(playlist1, playlist2) {
    return (
      playlist1.editable > playlist2.editable ||
      playlist1.editable === playlist2.editable && playlist1.title > playlist2.title
    ) ? 1 : -1;
  }
}
