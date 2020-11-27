import Constants from '../constants';
import Utilities from '../utilities';

const MUSICBRAINZ_SEARCH_URL = 'http://musicbrainz.org/ws/2/recording/';
const COVERARTARCHIVE_URL = 'https://coverartarchive.org/release/';

export default class MusicBrainzCoverArt {
  static fetch(song) {
    let searchTitle = song.title.replace('"', '\\"');
    let searchArtist = song.artist.replace('"', '\\"');
    let searchTerm = encodeURIComponent(`recording:"${searchTitle}" AND artist:"${searchArtist}"`);
    let url = `${MUSICBRAINZ_SEARCH_URL}?fmt=json&query=${searchTerm}`;
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then(this._fetchReleaseCover)
    .then(this._verifyImageExists);
  }

  static _fetchReleaseCover(data) {
    if (
      data &&
      data.recordings &&
      data.recordings[0] &&
      data.recordings[0].releases &&
      data.recordings[0].releases[0] &&
      data.recordings[0].releases[0].id) {
      return `${COVERARTARCHIVE_URL}${data.recordings[0].releases[0].id}/front`;
    } else {
      throw new Error('Unable to fetch coverart (recording not found on musicbrainz)');
    }
  }

  static _verifyImageExists(coverUrl) {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = resolve.bind(this, coverUrl);
      image.onerror = reject;
      image.src = coverUrl;
    });
  }
}
