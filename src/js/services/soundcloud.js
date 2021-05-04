import Utilities from '../utilities';
import SoundcloudDownloader from './soundcloud_downloader';

export default class Soundcloud {
  static get client_id() {
    return 'gQNnQIZA6cda2jMKQAZPD6Nojbed3yIa';
  }

  static extractId(url) {
    return Soundcloud.getInfo(url)
    .then((info) => info.id);
  }

  static getInfo(url) {
    if (!Soundcloud.isSoundcloudURL(url)) {
      return Promise.reject({ error: 'not a soundcloud track' });
    }
    return SoundcloudDownloader.getClientId()
    .then(clientId => fetch(`https://api-v2.soundcloud.com/resolve?url=${url}&client_id=${clientId}`))
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
    return SoundcloudDownloader.getClientId()
    .then(clientId => fetch(`https://api-v2.soundcloud.com/search?q=${encodeURIComponent(query)}&client_id=${clientId}`))
    .then(Utilities.fetchToJson)
    .then(response => response.collection.filter(item => item.kind === 'track'))
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
      url: soundcloudTrack.permalink_url
    };
  }

  static _getThumbnail(soundcloudTrack) {
    const thumbnail = soundcloudTrack.artwork_url ?
      soundcloudTrack.artwork_url :
      soundcloudTrack.user.avatar_url;
    return thumbnail && thumbnail.replace('large.jpg', 't500x500.jpg');
  }
}
