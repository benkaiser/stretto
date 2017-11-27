import Constants from '../constants';
import MusicBrainzCoverArt from './music_brainz_cover_art';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from './/soundcloud';
import Youtube from './youtube';
import async from 'async';
import Importer from './importer';

export default class SpotifyImporter extends Importer {
  _addSong(song) {
    song.thumbnailUrl = song.cover || song.thumbnailUrl;
    const songModel = super._addSong(song);
    Playlist.getOrCreateByTitle('Spotify Imports').addSong(songModel);
  }

  _findMusicBrainzCover(song) {
    return Promise.resolve(song);
  }

  _findMusicBrainzCover(song) {
    if (song.cover) {
      return Promise.resolve(song);
    } else {
      return super._findMusicBrainzCover(song);
    }
  }
}
