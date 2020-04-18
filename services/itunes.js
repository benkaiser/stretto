const fetch = require('node-fetch');
const NodeCache = require( "node-cache" );

const dayInSeconds = 86400;
const hourInSecconds = 3600;
const MAX_FOLLOWED_SONG = 200;

const itunesApiCache = new NodeCache( { stdTTL: dayInSeconds, checkperiod: hourInSecconds } );
const artistImageCache = new NodeCache( { stdTTL: dayInSeconds, checkperiod: hourInSecconds } );
const feedCache = new NodeCache( { stdTTL: hourInSecconds, checkperiod: hourInSecconds } );

module.exports = class Itunes {
  static getArtistResults(lookup) {
    if (itunesApiCache.get(lookup)) {
      return Promise.resolve(itunesApiCache.get(lookup));
    }
    return fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(lookup)}&entity=musicArtist&limit=5`)
    .then(response => {
      return response.json()
      .then(responseJson => {
        if (response.ok) {
          itunesApiCache.set(lookup, responseJson);
        }
        return responseJson;
      });
    });
  }

  static getSongsForArtists(artists) {
    if (!artists) {
      return Promise.reject('No agmArtistId for artist');
    }
    var oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const lookup = artists.map(artist => artist.amgArtistId).filter(id => !!id).join(',');
    const feedCachedItem = feedCache.get(lookup);
    return (feedCachedItem
      ? Promise.resolve(feedCache.get(lookup))
      : fetch(`https://itunes.apple.com/lookup?amgArtistId=${lookup}&entity=song&limit=20000`)
      .then(response => {
        return response.json()
        .then(responseJson => {
          if (response.ok) {
            feedCache.set(lookup, responseJson);
          }
          return responseJson;
        });
      })
    ).then(responseItems => responseItems.results)
    .then(results => results.filter(result => result.wrapperType === 'track' && result.kind === 'song'))
    .then(results => results.map(result => Itunes.standardItem(result)))
    .then(results => results.sort((a, b) => a.releaseDate < b.releaseDate ? 1 : -1))
    .then(results => results.filter((item, index) => results.findIndex(findItem => findItem.id === item.id) === index))
    .then(results => results.filter(result => new Date(result.releaseDate) > oneYearAgo).slice(0, MAX_FOLLOWED_SONG));
  }

  // takes an artist page and finds the image for them
  // https://music.apple.com/us/artist/sleeping-with-sirens/360773035?uo=4
  static getPhotoOfArtist(artistPage) {
    if (artistImageCache.get(artistPage)) {
      return Promise.resolve(artistImageCache.get(artistPage));
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
        artistImageCache.set(artistPage, largeUrl);
        return largeUrl;
      });
    });
  }

  static standardItem(itunesItem) {
    return {
      title: itunesItem.trackName,
      artist: itunesItem.artistName,
      album: itunesItem.collectionName,
      cover: itunesItem.artworkUrl100.replace('100x100', '600x600'),
      deferred: true,
      id: 'itunes_' + itunesItem.trackId,
      discNumber: itunesItem.discNumber,
      trackNumber: itunesItem.trackNumber,
      year: true,
      explicit: itunesItem.trackExplicitness,
      releaseDate: itunesItem.releaseDate
    };
  }
}
