import fetchJsonp from 'fetch-jsonp';

let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
let apiKey = 'AIzaSyBzVTAJq_j_WsltEa45EUaMHHmXlz8F_PM';

export default class Youtube {
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
      fetchJsonp(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&fields=items(snippet)&part=snippet`)
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
            thumbnail: this.maximumResolution(snippet.thumbnails),
            url: `https://www.youtube.com/watch?v=${id}`,
            year: (new Date(snippet.publishedAt)).getFullYear()
          });
        })
        .catch((error) => {
          reject({ error: error });
        });
    });
  }

  static maximumResolution(thumbnails) {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.standard) return thumbnails.standard.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;
  }
}
