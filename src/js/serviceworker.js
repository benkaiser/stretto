import ytdl from "react-native-ytdl";

var CACHE_NAME = 'stretto-cache';
var MUSIC_CACHE = 'stretto-cache-audio';
var urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/assets/favicon.png',
  '/static/assets/wisdom.otf',
  'https://apis.google.com/js/client.js',
  'https://www.youtube.com/iframe_api',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',

];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

function isAppUrl(path) {
  return path === '/'
    || path.startsWith('/playlist')
    || path.startsWith('/discover')
    || path.startsWith('/add')
    || path.startsWith('/import')
    || path.startsWith('/backup')
    || path.startsWith('/welcome')
    || path.startsWith('/settings')
    || path.startsWith('/spotify')
    || path.startsWith('/sync')
    || path.startsWith('/search')
    || path.startsWith('/artists/')
    || path.startsWith('/soundcloud');
}

function isOfflineUrl(path) {
  return path.startsWith('/offlineaudio/');
}

function isCacheableThirdParty(request) {
  return request.url.includes('//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/')
  || request.url.includes('ytimg.com')
  || request.url.includes('mzstatic.com')
  || request.url.includes('cdnjs.cloudflare.com');
}

function isRefreshableFirstParty(request) {
  return request.url.includes('/static/js/main.js');
}

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (self.registration.scope.includes(url.origin) && isAppUrl(url.pathname)) {
    return event.respondWith(
      caches.match('/')
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          console.log('cache hit for ', event.request);
          return response;
        }
        return fetch(event.request);
      })
    );
  }
  if (self.registration.scope.includes(url.origin) && isOfflineUrl(url.pathname)) {
    return event.respondWith(
      caches.open(MUSIC_CACHE)
      .then(cache => cache.match(event.request))
    );
  }
  event.respondWith(
    caches.open(CACHE_NAME)
    .then(cache =>
      cache.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        const refetch = fetch(event.request).then(function(response) {
          if (isCacheableThirdParty(event.request) || isRefreshableFirstParty(event.request)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
        if (response) {
          console.log('cache hit for ', event.request);
          return response;
        }
        return refetch;
      })
    )
  );
});

function cacheYoutubeFile(payload) {
  return fetch(payload.format.url)
  .then(response => {
    caches.open(MUSIC_CACHE)
    .then(cache => {
      cache.put('/offlineaudio/' + payload.youtubeId, response);
    });
  });
}

const broadcast = new BroadcastChannel('stretto-sw');
broadcast.onmessage = (event) => {
  if (!event.data || !event.data.type) {
    return;
  }
  if (event.data.type === 'EMIT_OFFLINED') {
    caches.open(MUSIC_CACHE)
    .then((cache) => cache.keys())
    .then(requests => {
      console.log('Offlined: ', requests);
      const offlineItems = requests.map(request => request.url.substring(request.url.lastIndexOf('/') + 1));
      broadcast.postMessage({ type: 'OFFLINED', payload: offlineItems });
    });
  }
  if (event.data.type === 'DOWNLOAD') {
    cacheYoutubeFile(event.data.payload);
    broadcast.postMessage({ type: 'OFFLINE_ADDED', payload: event.data.payload.youtubeId });
  }
};