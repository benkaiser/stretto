const broadcast = new BroadcastChannel('stretto-sw');
var CACHE_NAME = 'stretto-cache';
var MUSIC_CACHE = 'stretto-cache-audio';
var urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/assets/favicon.png',
  '/static/assets/wisdom.otf',
  'https://apis.google.com/js/client.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',

];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

addEventListener('activate', event => {
  event.waitUntil(async function() {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  }());
});

function isAppUrl(path) {
  return path === '/'
    || path.startsWith('/playlist')
    || path.startsWith('/discover')
    || path.startsWith('/add')
    || path.startsWith('/backup')
    || path.startsWith('/welcome')
    || path.startsWith('/settings')
    || path === '/spotify'
    || path.startsWith('/sync')
    || path.startsWith('/reset')
    || path.startsWith('/search')
    || path === '/artists/feed'
    || path === '/artists/add'
    || path === '/artists/manage'
    || path.startsWith('/soundcloud');
}

function isOfflineUrl(path) {
  return path.startsWith('/offlineaudio/');
}

function isCacheableThirdParty(request) {
  return request.url.includes('//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/')
  || request.url.includes('ytimg.com')
  || request.url.includes('audius.co')
  || (request.url.includes('sndcdn.com') && !request.url.includes('media.sndcdn.com'))
  || request.url.includes('i.scdn.co')
  || request.url.includes('mzstatic.com')
  || request.url.includes('cdnjs.cloudflare.com')
  || request.url.includes('azlyrics.com')
  || request.url.includes('cdnjs.cloudflare.com');
}

function isOpaqueCacheable(request) {
  return request.url.includes('fonts.googleapis.com');
}

function isRefreshableFirstParty(request) {
  return request.url.includes('/static/js/main.js');
}

function isOpaqueResponse(response) {
  return response.type === "opaque";
}

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (self.registration.scope.includes(url.origin) && isAppUrl(url.pathname)) {
    return event.respondWith(
      caches.match('/')
      .then(function(response) {
        const refetch = event.preloadResponse && event.preloadResponse.then((response) => {
          if (response) {
            caches.open(CACHE_NAME).then(cache => cache.put('/', response));
          }
          return response || fetch(event.request.url);
        });
        if (response) {
          event.waitUntil(refetch);
          return response;
        }
        return refetch;
      })
    );
  }
  if (self.registration.scope.includes(url.origin) && isOfflineUrl(url.pathname)) {
    return event.respondWith(
      caches.open(MUSIC_CACHE)
      .then(cache =>
        cache.match(event.request, { ignoreSearch: true, ignoreVary: true })
        .then(response => {
          if (response) {
            return response;
          }
          const url = new URL(event.request.url);
          const src = url.searchParams.get('src');
          if (src) {
            return fetch(src, { mode: 'cors'})
            .then(response => {
              if (!response.ok) {
                console.error("Failed to fetch offline url");
                console.error(src);
                console.error(response);
                return new Response(null, { status: 500 });
              }
              const originalUrl = event.request.url.split('?')[0];
              cache.put(originalUrl, response.clone())
              .then(() => {
                broadcast.postMessage({ type: 'OFFLINE_ADDED', payload: {
                  id: originalUrl.substring(originalUrl.lastIndexOf('/') + 1),
                  contentType: response.headers.get('Content-Type')
                }});
              })
              .catch(error => {
                console.log("Failed to store song in cache");
                console.error(error);
              });
              return response;
            });
          }
        })
      )
    );
  }
  event.respondWith(
    caches.open(CACHE_NAME)
    .then(cache =>
      cache.match(event.request)
      .then(function(response) {
        const refetch = fetch(event.request).then(function(response) {
          if (isOpaqueResponse(response)) {
            if (isOpaqueCacheable(event.request)) {
              cache.put(event.request, response.clone())
              .catch(error => {
                console.log("Failed to store resource in cache");
                console.error(error);
              });
            } else {
              console.warn("Skipping caching of request with opaque response");
              console.warn(event.request, response);
            }
           return response;
          }
          if (isCacheableThirdParty(event.request) || isRefreshableFirstParty(event.request)) {
            cache.put(event.request, response.clone())
            .catch(error => {
              console.log("Failed to store resource in cache");
              console.error(error);
            });
          }
          return response;
        });
        // Cache hit - return response
        if (response) {
          return response;
        }
        return refetch;
      })
    )
  );
});

function cacheYoutubeFile(payload) {
  return fetch(payload.url)
  .then(response =>
    caches.open(MUSIC_CACHE)
    .then(cache => cache.put('/offlineaudio/' + payload.youtubeId, response))
    .then(() => response.headers.get('Content-Type'))
    .catch(error => {
      console.log("Failed to store song in cache");
      console.error(error);
      throw error;
    })
  );
}

function cacheRawFile(payload) {
  const blob = new Blob([payload.rawFile], {
    type: 'audio/mpeg',
  });
  const headers = new Headers();
  headers.set('content-length', payload.rawFile.length);
  headers.set('accept-ranges', 'bytes');
  var songResponse = new Response(blob, {
    status : 200,
    headers: headers,
  });
  return caches.open(MUSIC_CACHE)
  .then(cache => cache.put('/offlineaudio/' + payload.songId, songResponse));
}

broadcast.onmessage = async (event) => {
  if (!event.data || !event.data.type) {
    return;
  }
  if (event.data.type === 'EMIT_OFFLINED') {
    const cache = await caches.open(MUSIC_CACHE)
    const requests = await cache.keys();
    const requestResponses = await Promise.all(requests.map(request => cache.match(request).then(response => [request, response])))
    const offlineItems = {};
    requestResponses.forEach(([request, response]) => {
      const id = request.url.substring(request.url.lastIndexOf('/') + 1);
      offlineItems[id] = {
        contentType: response.headers.get('Content-Type')
      };
    });
    broadcast.postMessage({ type: 'OFFLINED', payload: offlineItems });
  }
  if (event.data.type === 'DOWNLOAD') {
    cacheYoutubeFile(event.data.payload)
    .then((contentType) => {
      broadcast.postMessage({ type: 'OFFLINE_ADDED', payload: {
        id: event.data.payload.youtubeId,
        contentType: contentType
      }});
    });
  }
  if (event.data.type === 'REMOVE_OFFLINE') {
    const cache = await caches.open(MUSIC_CACHE);
    cache.delete('/offlineaudio/' + event.data.payload.songId)
    .then(() => console.log('Removed item from cache'))
    .catch(() => console.error('Failed to remove item from cache'));
  }
  if (event.data.type === 'OFFLINE_RAW_FILE') {
    cacheRawFile(event.data.payload)
    .then(() => {
      broadcast.postMessage({ type: 'OFFLINE_ADDED', payload: {
        id: event.data.payload.songId,
        contentType: 'audio/mpeg' // we assume all hls streams from soundcloud return mp3s
      }});
    })
    .catch(error => {
      console.log("Failed to cache song");
      console.error(error);
    });
  }
};