import Song from '../models/song';
import async from 'async';
import Itunes from './itunes';

const PAUSE_INTERVAL = 1000;

export default class ExplicitScanner extends EventTarget {
  static get instance() {
    return ExplicitScanner._instance || (ExplicitScanner._instance = new ExplicitScanner());
  }

  constructor() {
    super();
    this._acceptingNewRequests = true;
  }

  start(songs) {
    if (!songs || !this._acceptingNewRequests) {
      return;
    }
    this.songs = songs;
    this.totalSongs = songs.length;
    this.foundSongs = 0;
    this.unfoundSongs = 0;
    this._acceptingNewRequests = false;
    async.eachLimit(this.songs, 1, (outerSong, callback) => {
      Itunes.fetchExplicit(outerSong).then(explicit => {
        this.foundSongs++;
        this._updateProgress(`Found explicitness (${explicit ? 'explicit' : 'not explicit'}) of: ${outerSong.title} - ${outerSong.artist}`);
        outerSong.explicit = explicit;
      }).catch(() => {
        this.unfoundSongs++;
        this._updateProgress(`Could not find explicitness of: ${outerSong.title} - ${outerSong.artist}`);
        console.log(`Could not find explicitness of: ${outerSong.title} - ${outerSong.artist}`);
      }).then(() => {
        setTimeout(callback, PAUSE_INTERVAL);
      });
    }, (err) => {
      Song.change();
      this._acceptingNewRequests = true;
      this._updateProgress('Finished!');
    });
  }

  inProgress() {
    return !this._acceptingNewRequests;
  }

  progress() {
    return (this.foundSongs + this.unfoundSongs) / this.songs.length * 100;
  }

  getState() {
    return this.songs;
  }

  _updateProgress(message) {
    const event = new Event('message');
    event.message = message;
    this.dispatchEvent(event);
  }
}
