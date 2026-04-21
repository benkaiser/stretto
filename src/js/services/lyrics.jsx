import * as React from 'react';
import Player from '../services/player';
import Bootbox from './bootbox';

const LYRIC_WAIT_TIMEOUT = 500;
const AZ_TOKEN_STORAGE_KEY = 'azlyrics_token';
const DEFAULT_AZ_TOKEN = '3880265dbb11b2a53fbce747c6a5c6d668f8274287e0889aad95b16baea8cd20';

const listeners = [];

function getAzToken() {
  try {
    return localStorage.getItem(AZ_TOKEN_STORAGE_KEY) || DEFAULT_AZ_TOKEN;
  } catch (_) {
    return DEFAULT_AZ_TOKEN;
  }
}

function looksLikeCaptcha(html) {
  if (!html) return true;
  const lower = html.toLowerCase();
  return lower.includes('captcha')
    || lower.includes('are you a human')
    || lower.includes('unusual traffic')
    || lower.includes('cf-challenge');
}

function sanitizeQuery(query) {
  return query
    .replace(/&/g, ' ')
    .replace(/[()\[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchUrl(query) {
  return `https://www.azlyrics.com/search/?q=${encodeURIComponent(sanitizeQuery(query))}&w=songs&p=1&x=${getAzToken()}`;
}

function userSearchUrl(query) {
  return `https://www.azlyrics.com/search.php?q=${encodeURIComponent(sanitizeQuery(query))}`;
}

function hasNoResults(html) {
  return /alert-warning[^>]*>[^<]*<b>no results<\/b>/i.test(html)
    || /your search returned <b>no results<\/b>/i.test(html);
}

function extractFirstSongLink(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('td.text-left a, .panel a');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (/azlyrics\.com\/lyrics\//.test(href)) {
      return href;
    }
  }
  return null;
}

function extractLyrics(html) {
  const commentMarker = 'Usage of azlyrics.com content by any third-party lyrics provider';
  const commentIdx = html.indexOf(commentMarker);
  if (commentIdx === -1) return null;
  const commentEnd = html.indexOf('-->', commentIdx);
  const contentStart = commentEnd !== -1 ? commentEnd + 3 : commentIdx;
  const divEnd = html.indexOf('</div>', contentStart);
  if (divEnd === -1) return null;
  const inner = html.substring(contentStart, divEnd);
  const text = inner
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i>|<\/i>|<b>|<\/b>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
  return text || null;
}

export default class Lyrics {
  static get lyrics() {
    return this._lyrics;
  }

  static get status() {
    return this._status;
  }

  static get currentQuery() {
    return this._query;
  }

  static initialise() {
    Player.addOnSongChangeListener(this._onSongChange.bind(this));
  }

  static addListener(listener) {
    listeners.push(listener);
  }

  static removeListener(listener) {
    listeners.splice(listeners.indexOf(listener), 1);
  }

  static show() {
    if (this._status === 'failed') {
      this.showFailure();
      return;
    }
    Bootbox.show('Lyrics', <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1 }}>
      {this._lyrics}
    </div>);
  }

  static showFailure() {
    const query = this._query || '';
    Bootbox.show('Lyrics unavailable', <div>
      <p>We couldn't fetch lyrics from AZLyrics. They may be asking you to solve a captcha, or the search token may have expired.</p>
      <p>Open their site directly, solve any captcha, and try again:</p>
      <p>
        <a href={userSearchUrl(query)} target="_blank" rel="noopener noreferrer" className="btn btn-warning">
          Search AZLyrics for "{query}"
        </a>
      </p>
    </div>);
  }

  static _onSongChange(newSong) {
    this._lyrics = undefined;
    this._status = undefined;
    this._query = `${newSong.title} ${newSong.artist}`;
    this._change();
    this._songTimeout && clearTimeout(this._songTimeout);
    const requestedQuery = this._query;
    this._songTimeout = setTimeout(() => {
      this._fetchLyrics(requestedQuery).catch((error) => {
        if (this._query !== requestedQuery) return;
        console.log('Unable to fetch lyrics for song');
        console.log(error);
        this._status = 'failed';
        this._change();
      });
    }, LYRIC_WAIT_TIMEOUT);
  }

  static _fetchLyrics(query) {
    return fetch(searchUrl(query), { credentials: 'omit' })
      .then(response => {
        if (!response.ok) throw new Error(`azlyrics search ${response.status}`);
        return response.text();
      })
      .then(html => {
        if (looksLikeCaptcha(html)) throw new Error('captcha');
        if (hasNoResults(html)) {
          if (this._query === query) {
            this._status = 'notfound';
            this._change();
          }
          return null;
        }
        const songUrl = extractFirstSongLink(html);
        if (!songUrl) throw new Error('no search results');
        return fetch(songUrl, { credentials: 'omit' }).then(r => {
          if (!r.ok) throw new Error(`azlyrics lyrics ${r.status}`);
          return r.text();
        });
      })
      .then(html => {
        if (!html) return;
        if (looksLikeCaptcha(html)) throw new Error('captcha');
        const lyrics = extractLyrics(html);
        if (!lyrics) throw new Error('lyrics not found in page');
        if (this._query !== query) return;
        this._lyrics = lyrics;
        this._status = 'found';
        this._change();
      });
  }

  static _change() {
    listeners.forEach((listener) => {
      try {
        listener instanceof Function && listener();
      } catch(error) {
        console.log('Error notifying Lyric listener');
        console.log(error);
      }
    });
  }
}
