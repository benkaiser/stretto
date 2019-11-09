import Constants from '../constants';
import MusicBrainzCoverArt from './music_brainz_cover_art';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from './/soundcloud';
import Youtube from './youtube';
import async from 'async';

// importer for Stretto 1.x (stretto desktop)
export default class ImporterOld {
  constructor(options) {
    this.data = options.data;
    this.progressCallback = options.progressCallback;
    this.progress = 0;
    this.PAUSE_INTERVAL = 1000;
  }

  start() {
    this.data.songs && async.eachLimit(this.data.songs, 1, (song, callback) => {
      this._findYoutubeVideo(song)
      .then(this._findMusicBrainzCover)
      .then((song) => {
        this._addSong(song);
        this._updateProgress(`Added: ${song.title} - ${song.artist}`);
        setTimeout(callback, this.PAUSE_INTERVAL);
      }).catch((error) => {
        console.log(`FAILED TO RESOLVE TRACK: "${song.title} - ${song.artist}" because ${error}`);
        this._updateProgress(`Failed to find "${song.title} ${song.artist}" item with ${error}`);
        setTimeout(callback, this.PAUSE_INTERVAL);
      });
    }, () => {
      this._updateProgress('Finished!');
    });
  }

  _addSong(song) {
    let songModel = Song.create({
      album: song.album || 'Unknown',
      artist: song.artist || 'Unknown',
      cover: song.thumbnailUrl || '',
      discNumber: song.disc || 0,
      duration: song.duration,
      explicit: false,
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
    return songModel;
  }

  _findMusicBrainzCover(song) {
    return new Promise((resolve) => {
      MusicBrainzCoverArt.fetch(song).then((cover) => {
        song.thumbnailUrl = cover;
        resolve(song);
      }).catch((error) => {
        resolve(song);
      });
    });
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
    this.progress++;
    this.progress > this.data.songs.length && (this.progress = this.data.songs.length);
    this.progressCallback && this.progressCallback(this.progress / this.data.songs.length, message);
    console.log(message);
  }
}
