import Utilities from '../utilities';
import fetchJsonp from 'fetch-jsonp';
import AccountManager from './account_manager';

let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const resolveIdentity = (i) => Promise.resolve(i);

export default class Youtube {
  static get API_KEY() {
    return env.GOOGLE_API_KEY;
  }

  static extractId(url) {
    let match = url.match(youtubeIdRegex);
    return (match && match[2].length == 11) ? match[2] : false;
  }

  static getInfo(url) {
    let id = Youtube.extractId(url);
    if (!id) {
      return Promise.reject({ error: 'not a youtube track' });
    }
    return fetchJsonp(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${this.API_KEY}&fields=items(id,snippet)&part=snippet`)
    .then(Utilities.fetchToJson)
    .then(({ items }) => {
      if (items[0]) {
        items[0].id = { videoId: id };
      }
      return items[0];
    })
    .then((item) => this._convertToStandardTrack(item))
    .catch((error) => {
      return Promise.reject({ error: error });
    });
  }

  static isYoutubeURL(url) {
    try {
      url = new URL(url);
      return url.hostname.indexOf('youtu') > -1;
    } catch (error) {
      return false;
    }
  }

  static search(query, options = {}) {
    const requestDurations = options.requestDurations === undefined ? true : options.requestDurations;
    const addThumbnail = options.addThumbnail === undefined ? true : options.addThumbnail;
    const maxResults = options.maxResults === undefined ? 5 : options.maxResults;
    return new Promise((resolve) => gapi.load('client', resolve))
    .then(() => gapi.client.load('youtube', 'v3'))
    .then(() =>
      gapi.client.youtube.search.list({
        maxResults: maxResults,
        q: query,
        type: 'video',
        videoEmbeddable: true,
        part: 'snippet'
      })
    )
    .then(response => response.result.items)
    .then(requestDurations ? ((items) => this._addDurations(items)) : resolveIdentity)
    .then(addThumbnail ? this._addThumbnails.bind(this) : resolveIdentity)
    .then(items => items.map(this._convertToStandardTrack).filter(item => item));
  }

  /**
   * Find the youtube automix for a song
   * @param youtubeId
   * @returns Promise with the playlistid of the mix 
   */
  static findMix(youtubeId) {
    return fetch(`/youtube/watch?v=${youtubeId}`)
    .then((response) => response.text())
    .then(responseText => {
      const results = /0026list=([^"\\]+)/.exec(responseText);
      if (results && results[1]) {
        return results[1];
      } else {
        return Promise.reject('Unable to find mix id');
      }
    });
  }

  static getPlaylist(playlistId, options = {}) {
    const requestDurations = options.requestDurations === undefined ? true : options.requestDurations;
    const addThumbnail = options.addThumbnail === undefined ? true : options.addThumbnail;
    return AccountManager.whenYoutubeLoaded
    .then(() => AccountManager.whenLoggedIn)
    .then(() => gapi.client.youtube.playlistItems.list({
      part: 'snippet',
      playlistId: playlistId,
      maxResults: 50
    }))
    .then(response => response.result.items.map(item => item.snippet))
    .then(requestDurations ? ((items) => this._addDurations(items)) : resolveIdentity)
    .then(addThumbnail ? this._addThumbnails.bind(this) : resolveIdentity)
    .then(items => items.map(this._convertToStandardTrack).filter(item => item))
    .then(this._guessSplitTitle.bind(this));
  }

  static _addDurations(items) {
    let videoIds = items.map((item) => (item.id || item.resourceId).videoId);
    return fetchJsonp(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${this.API_KEY}`)
    .then(Utilities.fetchToJson)
    .then((data) => {
      data.items.forEach((dataItem, index) => {
        items[index].duration = this._durationToSeconds(dataItem.contentDetails.duration);
      });
      return items;
    });
  }

  static _addThumbnails(items) {
    return items.map((item) => {
      item.thumbnail = this._maximumResolution((item.snippet || item).thumbnails);
      return item;
    });
  }

  static _convertToStandardTrack(track) {
    const id = (track.id || track.resourceId || {}).videoId;
    if (!id) { return undefined; }
    const snippet = track.snippet || track;
    const thumbnail = Youtube._maximumResolution(snippet.thumbnails);
    return {
      channel: snippet.channelTitle,
      cover: thumbnail,
      id: id,
      isSoundcloud: false,
      isYoutube: true,
      title: snippet.title,
      thumbnail: thumbnail,
      url: `https://www.youtube.com/watch?v=${id}`,
      year: (new Date(snippet.publishedAt)).getFullYear()
    };
  }

  // utility function from: https://stackoverflow.com/a/30134889/485048
  static _durationToSeconds(duration) {
    let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    let hours = (parseInt(match[1]) || 0);
    let minutes = (parseInt(match[2]) || 0);
    let seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  static _guessSplitTitle(items) {
    return items.map((item) => {
      const youtubeTitle = item.title; 
      const dashIndex = youtubeTitle.indexOf('-');
      if (dashIndex > -1) {
        item.title = youtubeTitle.substr(dashIndex + 1).trim();
        item.artist = youtubeTitle.substr(0, dashIndex).trim();
      } else {
        item.artist = item.channel;
      }
      return item;
    });
  }

  static _maximumResolution(thumbnails) {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.standard) return thumbnails.standard.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;
  }
}
