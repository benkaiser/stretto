import Constants from '../constants';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Youtube from './youtube';
import async from 'async';
import Alerter from './alerter';

const PAUSE_INTERVAL = 500;

export default class SpotifyImporter extends EventTarget {
  static get instance() {
    return SpotifyImporter._instance || (SpotifyImporter._instance = new SpotifyImporter());
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
    this._acceptingNewRequests = false;
    async.eachLimit(this.songs, 1, (outerSong, callback) => {
      this._findYoutubeVideo(outerSong)
      .then((song) => {
        this._addSong(song);
        this._updateProgress(`Added: ${song.title} - ${song.artist}`);
        outerSong.state = 'success';
        setTimeout(callback, PAUSE_INTERVAL);
      }).catch((error) => {
        console.log(`FAILED TO RESOLVE TRACK: "${outerSong.title} - ${outerSong.artist}" because ${error}`);
        Alerter.error(`Failed to add "${outerSong.title}" by "${outerSong.artist}" from Spotify`)
        this._updateProgress(`Failed to find "${outerSong.title} ${outerSong.artist}" item with ${error}`);
        outerSong.state = 'error';
        outerSong.error = error;
        setTimeout(callback, PAUSE_INTERVAL);
      });
    }, () => {
      this._acceptingNewRequests = true;
      this._updateProgress('Finished!');
    });
  }

  inProgress() {
    return !this._acceptingNewRequests;
  }

  getState() {
    return this.songs;
  }

  _addSong(song) {
    song.cover = song.cover || song.thumbnailUrl;
    let songModel = Song.create({
      album: song.album || 'Unknown',
      artist: song.artist || 'Unknown',
      cover: song.cover || '',
      discNumber: song.disc || 0,
      duration: song.duration,
      explicit: song.explicit,
      genre: song.genre || 'Unknown',
      id: song.youtubeId,
      isSoundcloud: false,
      isYoutube: true,
      title: song.title || 'Unknown',
      trackNumber: song.track || 0,
      url: `https://youtu.be/${song.youtubeId}`,
      year: song.year || ''
    });
    Playlist.getByTitle(Playlist.LIBRARY).addSong(songModel);
    song.playlists && song.playlists.forEach((playlist) => {
      Playlist.getOrCreateByTitle(playlist).addSong(songModel);
    });
    Playlist.getOrCreateByTitle('Spotify Imports').addSong(songModel);
  }

  _findYoutubeVideo(song) {
    return Youtube.search(`${song.title} ${song.artist}`).then((youtubeItems) => {
      if (!youtubeItems.length) { throw new Error('Unable to find youtube matches'); }
      let match = this._pickBestMatch(song, youtubeItems);
      song.duration = match.duration;
      song.thumbnailUrl = match.thumbnail;
      song.youtubeId = match.id;
      return song;
    });
  }

  _pickBestMatch(song, youtubeItems) {
    if (youtubeItems[0].duration < song.duration + Constants.VARIANCE_FACTOR &&
        youtubeItems[0].duration > song.duration - Constants.VARIANCE_FACTOR) {
      return youtubeItems[0];
    }
    let closestMatch = youtubeItems[0];
    youtubeItems.forEach((item) => {
      if (Math.abs(item.duration - song.duration) < Math.abs(closestMatch - song.duration)) {
        closestMatch = item;
      }
    });
    return closestMatch;
  }

  _updateProgress(message) {
    const event = new Event('message');
    event.message = message;
    this.dispatchEvent(event);
  }
}
