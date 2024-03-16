import Alerter from '../services/alerter';
import ServiceWorkerClient from '../services/service_worker_client';
import Youtube from '../services/youtube';

let listeners = [];
let noDataListeners = [];
let songs = [];
let offlineSongs = {};
let offlineSongsIds = [];
let offlineReady;
const offlineReadyPromise = new Promise(resolve => offlineReady = resolve);

function checkImage(url, minWidth) {
  let resolveFunc;
  let rejectFunc;
  let checkImagePromise = new Promise((resolve, reject) => { resolveFunc = resolve; rejectFunc = reject });
  var image = new Image();
  image.onload = function() {
    if (this.width > minWidth) {
      resolveFunc();
    } else {
      rejectFunc();
    }
  }
  image.onerror = function() {
    rejectFunc();
  }
  image.src = url;
  return checkImagePromise;
}

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
    this.playInLibrary = attrs.playInLibrary === undefined ? true : attrs.playInLibrary;
    this.isSoundcloud = attrs.isSoundcloud || false;
    this.isYoutube = attrs.isYoutube || false;
    this.isAudius = attrs.isAudius || false;
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
      playInLibrary: this.playInLibrary,
      id: this.id,
      isSoundcloud: this.isSoundcloud,
      isYoutube: this.isYoutube,
      isAudius: this.isAudius,
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
    } else if (this.isAudius && id.indexOf('a_') !== 0) {
      this.id = 'a_' + this.id;
    }
  }

  getTrack() {
    return Youtube.search(`${this.title} ${this.artist} lyrics`).then(([youtubeItem]) => {
      if (!youtubeItem) { throw new Error('Unable to find youtube matches'); }
      this.deferred = undefined;
      this.duration = youtubeItem.duration;
      this.id = 'y_' + youtubeItem.id;
      this.isYoutube = true;
      return this;
    });
  }

  cacheOffline(rawBytes) {
    if (this.isYoutube) {
      ServiceWorkerClient.offlineYoutube(this.originalId);
    } else if (this.isSoundcloud) {
      ServiceWorkerClient.offlineSoundcloud(this.originalId, rawBytes);
    } else {
      console.log('Not implemented');
    }
  }

  removeOffline() {
    ServiceWorkerClient.removeOffline(this.originalId);
    offlineSongsIds = offlineSongsIds.filter(offlineId => offlineId !== this.originalId);
  }

  fixCoverArt() {
    if (this.inLibrary && this.isYoutube) {
      const coverGuesses = [
        'https://img.youtube.com/vi/' + this.originalId + '/maxresdefault.jpg',
        'https://img.youtube.com/vi/' + this.originalId + '/hqdefault.jpg',
        'https://img.youtube.com/vi/' + this.originalId + '/0.jpg'
      ];
      this._setCoverIfValid(coverGuesses[0], 1000)
      .catch(() => this._setCoverIfValid(coverGuesses[1], 100))
      .catch(() => this._setCoverIfValid(coverGuesses[2], 1))
      .catch((error) => {
        console.error(error);
        console.log(`Failed to fetch cover art for: ${this.title}`);
      });
    }
  }

  _setCoverIfValid(coverGuess, minWidth) {
    return checkImage(coverGuess, minWidth).then(() => {
      this.cover = coverGuess;
      Song.change();
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

  get offline() {
    return offlineSongsIds.includes(this.originalId);
  }

  get offlineExtension() {
    const contentType = offlineSongs[this.originalId].contentType;
    if (contentType === 'audio/webm') {
      return '.webm';
    }
    return '.mp3';
  }

  static addOnChangeListener(listener, listenToNoDataChange) {
    listeners.push(listener);
    if (listenToNoDataChange) {
      noDataListeners.push(listener);
    }
  }

  static removeOnChangeListener(listener) {
    if (listeners.indexOf(listener) > -1) {
      listeners.splice(listeners.indexOf(listener), 1);
    }
    if (noDataListeners.indexOf(listener) > -1) {
      noDataListeners.splice(listeners.indexOf(listener), 1);
    }
  }

  static change() {
    listeners.forEach((listener) => {
      listener instanceof Function && listener(songs);
    });
  }

  static noDataChange() {
    noDataListeners.forEach((listener) => {
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

  static findByOriginalId(songId) {
    return this.fetchAll().filter((song) => song.originalId === songId)[0];
  }

  static offlineSongIds() {
    return offlineSongsIds;
  }

  static initialise(initialData) {
    songs = [];
    initialData.forEach((item) => {
      if (item.id) {
        songs.push(new Song(item));
      }
    });
    ServiceWorkerClient.getOffline()
    .then(offlinedSongs => {
      if (offlinedSongs.length) {
        offlinedSongs = offlinedSongs.reduce((previous, current) => previous[current.id] = {}, {});
      }
      offlineSongsIds = Object.keys(offlinedSongs);
      offlineSongs = offlinedSongs;
      Song.noDataChange();
      offlineReady();
    })
    .catch(() => {
      offlineReady();
    });
    ServiceWorkerClient.addOfflineListener((payload) => {
      if (typeof payload !== 'object') {
        payload = { id: payload };
      }
      if (!offlineSongs[payload.id]) {
        offlineSongsIds.push(payload.id);
        offlineSongs[payload.id] = { contentType: payload.contentType };
        Song.noDataChange();
        const song = Song.findByOriginalId(payload.id);
        if (song && song.title) {
          Alerter.success('"' + song.title + '" available offline');
        }
      }
    });
  }

  static waitForOffline() {
    return offlineReadyPromise;
  }

  static remove(song) {
    let index = songs.indexOf(song);
    if (index === -1) { return; }
    songs.splice(index, 1);
    Song.change();
  }
}