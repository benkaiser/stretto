import fetchJsonp from 'fetch-jsonp';

let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

export default class Youtube {
  static get API_KEY() {
    return env.GOOGLE_API_KEY;
  }

  static extractId(url) {
    let match = url.match(youtubeIdRegex);
    return (match && match[2].length == 11) ? match[2] : false;
  }

  static getInfo(url) {
    return new Promise((resolve, reject) => {
      let id = Youtube.extractId(url);
      if (!id) {
        return reject({ error: 'not a youtube track' });
      }
      fetchJsonp(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${this.API_KEY}&fields=items(snippet)&part=snippet`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          let snippet = data.items[0].snippet;
          resolve({
            channel: snippet.channelTitle,
            id: id,
            isSoundcloud: false,
            isYoutube: true,
            title: snippet.title,
            thumbnail: this._maximumResolution(snippet.thumbnails),
            url: `https://www.youtube.com/watch?v=${id}`,
            year: (new Date(snippet.publishedAt)).getFullYear()
          });
        })
        .catch((error) => {
          reject({ error: error });
        });
    });
  }

  static search(query) {
    return new Promise((resolve, reject) => {
      let request = gapi.client.youtube.search.list({
        q: query,
        part: 'snippet'
      });
      request.execute(resolve);
    }).then((response) => this._addDurations(response.items))
    .then(this._addThumbnails.bind(this));
  }

  static _addDurations(items) {
    let videoIds = items.map((item) => item.id.videoId);
    return fetchJsonp(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${this.API_KEY}`)
    .then((response) => {
      return response.json();
    }).then((data) => {
      data.items.forEach((dataItem, index) => {
        items[index].duration = this._durationToSeconds(dataItem.contentDetails.duration);
      });
      return items;
    });
  }

  static _addThumbnails(items) {
    return items.map((item) => {
      item.thumbnail = this._maximumResolution(item.snippet.thumbnails);
      return item;
    });
  }

  // utility function from: https://stackoverflow.com/a/30134889/485048
  static _durationToSeconds(duration) {
    let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    let hours = (parseInt(match[1]) || 0);
    let minutes = (parseInt(match[2]) || 0);
    let seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  static _maximumResolution(thumbnails) {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.standard) return thumbnails.standard.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;
  }
}
