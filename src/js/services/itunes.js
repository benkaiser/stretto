import Constants from '../constants';
import Song from '../models/song';
import Utilities from '../utilities';
import Youtube from './youtube';

export default class Itunes {
  static search(searchTerm) {
    searchTerm = encodeURI(searchTerm);
    let url = `/proxy/search?term=${searchTerm}&entity=song&limit=50&country=us`;
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then((data) => {
      console.log(data);
      return Promise.all(
        data.results.map(this._getYoutubeTrackForSong)
      ).then((items) => items.filter(item => item));
    }).then(this._removeDuplicates);
  }

  static fetchCover(song) {
    let searchTerm = encodeURI(`${song.title} ${song.artist}`);
    let url = `/proxy/search?term=${searchTerm}&entity=song&limit=10&country=us`;
    return fetch(url)
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.resultCount && this._isResultClose(song, data.results[0])) {
        return data.results[0].artworkUrl100.replace('100x100', '600x600');
      } else {
        throw new Error('Unable to find coverart from itunes');
      }
    });
  }

  static _getYoutubeTrackForSong(song) {
    return Youtube.search(song.trackName + ' ' + song.artistName, {
      requestDurations: false,
      addThumbnail: false,
      maxResults: 1
    }).then(items => items[0])
    .then(item => {
      if (!item) {
        return;
      }
      item.title = song.trackName;
      item.artist = song.artistName;
      item.cover = song.artworkUrl100.replace('100x100', '600x600');
      item.album = song.collectionName;
      item.discNumber = song.discNumber;
      item.trackNumber = song.trackNumber;
      return new Song(item);
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
