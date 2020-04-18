const fetch = require('node-fetch');

const itunesApiCache = {};
const artistImageCache = {};

module.exports = class Itunes {
  static getArtistResults(lookup) {
    if (itunesApiCache[lookup]) {
      return Promise.resolve(itunesApiCache[lookup]);
    }
    return fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(lookup)}&entity=musicArtist&limit=5`)
    .then(response => {
      return response.json()
      .then(responseJson => {
        if (response.ok) {
          itunesApiCache[lookup] = responseJson;
        }
        return responseJson;
      });
    });
  }

  // takes an artist page and finds the image for them
  // https://music.apple.com/us/artist/sleeping-with-sirens/360773035?uo=4
  static getPhotoOfArtist(artistPage) {
    if (artistImageCache[artistPage]) {
      return Promise.resolve(artistImageCache[artistPage]);
    }
    return fetch(artistPage)
    .then(response => {
      if (!response.ok) {
        return Promise.reject('iTunes request failed with status: ' + response.status);
      }
      return response.text()
      .then(rawHtml => {
        const url = rawHtml.match(/srcset=\"([^" ]+)/)[1];
        const largeUrl = url.replace(/[\d]+x[\d]+/, '500x500');
        artistImageCache[artistPage] = largeUrl;
        return largeUrl;
      });
    });
  }
}
