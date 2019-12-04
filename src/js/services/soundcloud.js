import Utilities from '../utilities';
import fetchJsonp from 'fetch-jsonp';

export default class Soundcloud {
  static get client_id() {
    return 'UW9ajvMgVdMMW3cdeBi8lPfN6dvOVGji';
  }

  static extractId(url) {
    return Soundcloud.getInfo(url)
    .then((info) => info.id);
  }

  static getInfo(url) {
    if (!Soundcloud.isSoundcloudURL(url)) {
      return Promise.reject({ error: 'not a soundcloud track' });
    }
    return fetch(`https://api.soundcloud.com/resolve?url=${url}&client_id=${Soundcloud.client_id}`)
    .then(Utilities.fetchToJson)
    .then((track) => Soundcloud._convertToStandardTrack(track))
    .catch((error) => {
      return Promise.reject({ error: error });
    });
  }

  static isSoundcloudURL(url) {
    return url.indexOf('https://soundcloud.com/') === 0;
  }

  static search(query) {
    return fetch(`https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&client_id=${Soundcloud.client_id}`)
    .then(Utilities.fetchToJson)
    .then((tracks) => tracks.map(Soundcloud._convertToStandardTrack));
  }

  static _convertToStandardTrack(soundcloudTrack) {
    return {
      album: 'Unknown Album',
      channel: soundcloudTrack.user.username,
      duration: soundcloudTrack.duration / 1000,
      genre: soundcloudTrack.genre,
      id: `${soundcloudTrack.id}`,
      isSoundcloud: true,
      isYoutube: false,
      thumbnail: Soundcloud._getThumbnail(soundcloudTrack),
      title: soundcloudTrack.title,
      url: soundcloudTrack.permalink_url,
      year: soundcloudTrack.release_year
    };
  }

  static _getThumbnail(soundcloudTrack) {
    const thumbnail = soundcloudTrack.artwork_url ?
      soundcloudTrack.artwork_url :
      soundcloudTrack.user.avatar_url;
    return thumbnail && thumbnail.replace('large.jpg', 't500x500.jpg');
  }
}
