import * as React from 'react';
import azlyrics from 'js-azlyrics';
import Player from '../services/player';
import Bootbox from './bootbox';

const LYRIC_WAIT_TIMEOUT = 500;

const options = {
  searchEndpoint: 'https://search.azlyrics.com',
  mainEndpoint: 'https://www.azlyrics.com'
};

const listeners = [];

export default class Lyrics {
  static get lyrics() {
    return this._lyrics;
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
    Bootbox.show('Lyrics', <div>
      {this._lyrics && this._lyrics.split('\n').map((item, key) => {
        return <span key={key}>{item}<br/></span>
      })}
    </div>);
  }

  static _onSongChange(newSong) {
    this._lyrics = undefined;
    this._songTimeout && clearTimeout(this._songTimeout);
    this._songTimeout = setTimeout(() => {
      azlyrics.get(newSong.title + ' ' + newSong.artist, options).then((song) => {
        if (song.lyrics) {
          console.log(`Found lyrics for ${song.song} by ${song.artist}`);
          this._lyrics = song.lyrics;
          this._change();
        }
     }).catch((error) => {
        console.log(error);
        console.log('Unable to fetch lyrics for song');
     });
    }, LYRIC_WAIT_TIMEOUT);
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
