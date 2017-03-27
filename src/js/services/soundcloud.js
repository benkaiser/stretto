import fetchJsonp from 'fetch-jsonp';

export default class Soundcloud {
  static get client_id() {
    return '310e867035eacd04d104cedd5705b31e';
  }

  static getInfo(url) {
    return new Promise((resolve, reject) => {
      if (!Soundcloud.isSoundcloudURL(url)) {
        return reject({ error: 'not a soundcloud track' });
      }
      fetch(`http://api.soundcloud.com/resolve?url=${url}&client_id=${Soundcloud.client_id}`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          resolve({
            album: 'Unknown Album',
            channel: data.user.username,
            duration: data.duration / 1000,
            genre: data.genre,
            id: `${data.id}`,
            isSoundcloud: true,
            isYoutube: false,
            thumbnail: data.artwork_url.replace('large.jpg', 't500x500.jpg'),
            title: data.title,
            url: data.permalink_url,
            year: data.release_year
          });
        })
        .catch((error) => {
          reject({ error: error });
        });
    });
  }

  static isSoundcloudURL(url) {
    return url.indexOf('https://soundcloud.com/') === 0;
  }
}
