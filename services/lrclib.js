const fetch = require('node-fetch');

const BASE_URL = 'https://lrclib.net/api/search';

function normalise(str) {
  return (str || '')
    .replace(/[\(\[].*?[\)\]]/g, ' ')
    .replace(/\b(feat|ft|featuring)\b.*/i, ' ')
    .replace(/official|lyric video|music video|audio|remastered( \d+)?|explicit/ig, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function similarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  setA.forEach(word => setB.has(word) && shared++);
  return (2 * shared) / (setA.size + setB.size);
}

function headers() {
  const result = { 'User-Agent': 'stretto' };
  if (process.env.LRCLIB_APP_ID) result['Lrclib-App-Id'] = process.env.LRCLIB_APP_ID;
  if (process.env.LRCLIB_API_KEY) result['Lrclib-Api-Key'] = process.env.LRCLIB_API_KEY;
  return result;
}

function search(params) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}?${query}`, { headers: headers(), timeout: 10000 })
    .then(response => {
      if (!response.ok) throw new Error(`LRCLIB responded ${response.status}`);
      return response.json();
    });
}

function score(wanted, result, duration) {
  let total = similarity(wanted.title, normalise(result.trackName))
    + 0.5 * similarity(wanted.artist, normalise(result.artistName));
  if (duration && result.duration && Math.abs(result.duration - duration) <= 5) total += 0.2;
  if (result.syncedLyrics) total += 0.05;
  return total;
}

// Resolves to { plainLyrics, syncedLyrics, match } or null when nothing suitable is found.
exports.findLyrics = function({ title, artist, duration }) {
  const wanted = { title: normalise(title), artist: normalise(artist) };
  if (!wanted.title.length) return Promise.resolve(null);
  return search({ artist_name: wanted.artist.join(' '), track_name: wanted.title.join(' ') })
    .then(results => results.length ? results : search({ q: `${wanted.artist.join(' ')} ${wanted.title.join(' ')}` }))
    .then(results => {
      let best = null;
      let bestScore = 0;
      results
        .filter(result => result.plainLyrics || result.syncedLyrics)
        .forEach(result => {
          const resultScore = score(wanted, result, duration);
          if (resultScore > bestScore) {
            best = result;
            bestScore = resultScore;
          }
        });
      if (!best || bestScore < 1) return null;
      return {
        plainLyrics: best.plainLyrics || null,
        syncedLyrics: best.syncedLyrics || null,
        match: `${best.artistName} - ${best.trackName}`
      };
    });
};
