import Constants from '../constants';
import Country from '../country';
import Song from '../models/song';
import Utilities from '../utilities';

export default class Itunes {
  static chartUrl(options) {
    options = options || {};
    options.limit = options.limit || 20;
    const countryCode = Country.current();
    const genreSection = options.genreCode ? `/genre=${options.genreCode}` : '';
    return `https://itunes.apple.com/${countryCode}/rss/topsongs/limit=${options.limit}${genreSection}/json`;
  }

  static search(searchTerm, offset) {
    searchTerm = encodeURI(searchTerm);
    let url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=50${offset ? '&offset=' + offset : ''}&country=` + Country.current();
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then((data) => {
      return data.results.map(this._deferredTrack);
    });
  }

  static fetchCover(song) {
    let searchTerm = encodeURI(`${song.title} ${song.artist}`);
    let url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=10&country=` + Country.current();
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then(data => {
      if (data.resultCount && this._isResultClose(song, data.results[0])) {
        return data.results[0].artworkUrl100.replace('100x100', '600x600');
      } else {
        throw new Error('Unable to find coverart from itunes');
      }
    });
  }

  static fetchExplicit(song) {
    let searchTerm = encodeURI(`${song.title} ${song.artist}`);
    let url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=10&country=` + Country.current();
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then(data => {
      if (data.resultCount && this._isResultClose(song, data.results[0])) {
        return data.results[0].trackExplicitness === 'explicit';
      } else {
        throw new Error('Unable to find coverart from itunes');
      }
    });
  }

  static fetchChart(options) {
    return fetch(Itunes.chartUrl(options))
    .then(Utilities.fetchToJson)
    .then(data => {
      if (!data || !data.feed || !data.feed.entry || data.feed.entry.length === 0) {
        return [];
      } else {
        return data.feed.entry.map(entry => {
          return new Song({
            title: entry['im:name'].label,
            artist: entry['im:artist'].label,
            album: entry['im:collection']['im:name'].label,
            cover: entry['im:image'][0].label.replace(/\/\d\dx\d\d/, '/600x600'),
            deferred: true
          });
        });
      }
    });
  }

  static _deferredTrack(song) {
    return new Song({
      // this id is temporary until a proper one is fetched from youtube
      id: song.trackId + '-' + song.collectionId + '-' + song.artistId,
      title: song.trackName,
      artist: song.artistName,
      cover: song.artworkUrl100.replace('100x100', '600x600'),
      album: song.collectionName,
      discNumber: song.discNumber,
      trackNumber: song.trackNumber,
      explicit: song.trackExplicitness === 'explicit',
      deferred: true
    });
  }

  static _isResultClose(song, result) {
    let durationSeconds = result.trackTimeMillis / 1000;
    return (
      song.duration < durationSeconds + Constants.VARIANCE_FACTOR &&
      song.duration > durationSeconds - Constants.VARIANCE_FACTOR
    );
  }

  static _removeDuplicates(items) {
    const ids = [];
    return items.filter(item => {
      if (ids.indexOf(item.id) != -1) {
        return false;
      }
      ids.push(item.id);
      return true;
    });
  }
}
