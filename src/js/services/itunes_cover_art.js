import Constants from '../constants';
import Utilities from '../utilities';
import fetchJsonp from 'fetch-jsonp';

export default class ItunesCoverArt {
  static fetch(song) {
    let searchTerm = encodeURI(`${song.title} ${song.artist}`);
    let url = `/proxy/search?term=${searchTerm}&entity=song&limit=10&country=us`;
    console.log(url);
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

  static _isResultClose(song, result) {
    let durationSeconds = result.trackTimeMillis / 1000;
    return (
      song.duration < durationSeconds + Constants.VARIANCE_FACTOR &&
      song.duration > durationSeconds - Constants.VARIANCE_FACTOR
    );
  }
}
