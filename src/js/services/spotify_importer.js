import Playlist from '../models/playlist';
import Importer from './importer_old';

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
