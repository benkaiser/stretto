import io from 'socket.io-client';
import AccountManager from './account_manager';
import Player from './player';

class SocketManager {
  constructor() {
    this._socket = io();
    this._socket.on( 'connect', () => {
      if (AccountManager.loggedInStretto) {
        this.join(AccountManager.email)
      }
    } );
    if (AccountManager.loggedInStretto) {
      this.join(AccountManager.email)
    } else {
      this._removeListener = AccountManager.addListener(() => {
        if (AccountManager.loggedInStretto) {
          this.join(AccountManager.email)
          this._removeListener();
        }
      });
    }
    this._socket.on('playpause', () => {
      Player.togglePlaying();
    });
    this._socket.on('next', () => {
      Player.next();
    });
    this._socket.on('previous', () => {
      Player.previous();
    });

    if (env.ENV == 'development') {
      this._socket.on('reconnect', () => {
        fetch('/static/js/bundle.js').then(response => {
          if (new Date() - new Date(response.headers.get('last-modified')) < 1000 * 5) {
            window.location.href = window.location.href;
          }
        });
      });
    }
  }

  join(room) {
    this._socket.emit('joinRoom', room);
  }

  announceControllable() {
    this._socket.emit('controllable');
  }

  sendPrevious() {
    this._socket.emit('previous');
  }

  sendNext() {
    this._socket.emit('next');
  }

  sendPlayPause() {
    this._socket.emit('playpause');
  }
}

export default new SocketManager();