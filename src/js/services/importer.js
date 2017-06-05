import Constants from '../constants';
import CoverArt from './cover_art';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from './/soundcloud';
import Youtube from './youtube';

export default class Importer {
  constructor(options) {
    this.data = options.data;
    this.progressCallback = options.progressCallback;
    this.progress = 0;
  }

  start() {
    this.data.songs && this.data.songs.map((song) => {
      Youtube.search(`${song.title} ${song.artist}`).then((youtubeItems) => {
        if (!youtubeItems.length) { throw new Error('Unable to find youtube matches'); }
        let match = this._pickBestMatch(song, youtubeItems);
        song.duration = match.duration;
        song.thumbnailUrl = match.thumbnail;
        song.youtubeId = match.id.videoId;
        return song;
      }).then((song) => {
        return new Promise((resolve) => {
          CoverArt.fetch(song).then((cover) => {
            song.thumbnailUrl = cover;
            resolve(song);
          }).catch((error) => {
            resolve(song);
          });
        });
      }).then((song) => {
        this._addSong(song);
        this._updateProgress();
      }).catch((error) => {
        this._updateProgress();
        console.log(error);
      });
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

  _updateProgress() {
    this.progress++;
    this.progressCallback && this.progressCallback(this.progress / this.data.length);
  }
}
