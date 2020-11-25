const broadcast = new BroadcastChannel('stretto-sw');

export default class ServiceWorkerClient {
  static initialise() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceworker.js').then(function(registration) {
          // Registration was successful
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }

  static available() {
    return 'serviceWorker' in navigator && navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === 'activated';
  }

  static getOffline() {
    let res;
    let promise = new Promise(resolve => res = resolve);
    let received = false;
    broadcast.onmessage = (message) => {
      if (!received && message.data.type === 'OFFLINED') {
        res(message.data.payload);
        received = true;
      }
    };
    broadcast.postMessage({
      type: 'EMIT_OFFLINED'
    });
    return promise;
  }

  static offlineYoutube(youtubeId) {
    let res;
    let promise = new Promise(resolve => res = resolve);
    let received = false;
    broadcast.onmessage = (message) => {
      if (!received && message.data.type === 'OFFLINE_ADDED') {
        res(message.data.payload);
        received = true;
      }
    };
    chrome.runtime.sendMessage(youtubeExtractorExtensionId, {
      type: 'YOUTUBE_AUDIO_FETCH',
      payload: 'https://youtube.com/watch?v=' + youtubeId
    }, (format) => {
      broadcast.postMessage({
        type: 'DOWNLOAD',
        payload: {
          youtubeId: youtubeId,
          format: format
        }
      });
    });
    return promise;
  }

  static offlineSoundcloud(soundcloudId, soundcloudRawFile) {
    let res;
    let promise = new Promise(resolve => res = resolve);
    let received = false;
    broadcast.onmessage = (message) => {
      if (!received && message.data.type === 'OFFLINE_ADDED') {
        res(message.data.payload);
        received = true;
      }
    };
    broadcast.postMessage({
      type: 'OFFLINE_RAW_FILE',
      payload: {
        songId: soundcloudId,
        rawFile: soundcloudRawFile
      }
    });
    return promise;
  }
}