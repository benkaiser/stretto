import $ from 'jquery';

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
      $.ajax({
        url: `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&fields=items(snippet)&part=snippet`,
        dataType: 'jsonp',
        success: (data) => {
          let snippet = data.items[0].snippet;
          resolve({
            author: snippet.channelTitle,
            id: id,
            title: snippet.title,
            thumbnail: snippet.thumbnails.maxres.url
          });
        },
        error: (jqXHR, textStatus, errorThrown) => {
          reject({ error: errorThrown });
        }
      });
    });
  }
}
