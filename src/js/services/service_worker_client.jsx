import * as React from 'react';
import { Button } from 'react-bootstrap';
import getHistory from 'react-router-global-history';
import Alerter from './alerter';

const broadcast = new BroadcastChannel('stretto-sw');

const broadcastListeners = [];
broadcast.onmessage = (message) => {
  broadcastListeners.forEach(listener => {
    listener(message);
  })
}
function addBroadcastListener(listener) {
  broadcastListeners.push(listener);
}

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
    addBroadcastListener((message) => {
      if (!received && message.data.type === 'OFFLINED') {
        res(message.data.payload);
        received = true;
      }
    });
    broadcast.postMessage({
      type: 'EMIT_OFFLINED'
    });
    return promise;
  }

  static offlineYoutube(youtubeId) {
    broadcast.postMessage({
      type: 'DOWNLOAD',
      payload: {
        youtubeId: youtubeId,
        url: env.YOUTUBE_REDIRECT_ENDPOINT + '?id=' + youtubeId,
      }
    });
  }

  static offlineSoundcloud(soundcloudId, soundcloudRawFile) {
    broadcast.postMessage({
      type: 'OFFLINE_RAW_FILE',
      payload: {
        songId: soundcloudId,
        rawFile: soundcloudRawFile
      }
    });
  }

  static removeOffline(id) {
    broadcast.postMessage({
      type: 'REMOVE_OFFLINE',
      payload: {
        songId: id
      }
    });
  }

  static addOfflineListener(listener) {
    addBroadcastListener((message) => {
      if (message.data.type === 'OFFLINE_ADDED') {
        listener(message.data.payload);
      }
    });
  }

  static offlineError(id) {
    Alerter.error(<p>
      Unable to play offline track. Removing cached version.
      <Button onClick={() => {
        window.lastRoute = getHistory().location.pathname;
        getHistory().push('/edit/' + id);
      }}>Edit Track</Button>
    </p>);
  }

  static youtubeError(id) {
    Alerter.error(<p>
      Unable to play youtube backing track.
      <Button onClick={() => {
        window.lastRoute = getHistory().location.pathname;
        getHistory().push('/edit/y_' + id);
      }}>Edit Track</Button>
    </p>);
  }

  static soundcloudError(id) {
    Alerter.error(<p>
      Unable to play soundcloud backing track.
      <Button onClick={() => {
        window.lastRoute = getHistory().location.pathname;
        getHistory().push('/edit/s_' + id);
      }}>Edit Track</Button>
    </p>);
  }

  static streamError(fullId, error) {
    console.error(error);
    let message = error.message || error.toString();
    Alerter.error(<p>
      Stream threw an error ({message})
      <Button onClick={() => {
        window.lastRoute = getHistory().location.pathname;
        getHistory().push('/edit/' + fullId);
      }}>Edit Track</Button>
    </p>);
  }

}