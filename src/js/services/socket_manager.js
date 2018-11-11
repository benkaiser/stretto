import io from 'socket.io-client';
import AccountManager from './account_manager';
import Player from './player';

class SocketManager {
  constructor() {
    this._socket = io();
    this._socket.on( 'connect', () => {
      if (AccountManager.loggedInGoogle) {
        this.join(AccountManager.email)
      }
    } );
    if (AccountManager.loggedInGoogle) {
      this.join(AccountManager.email)
    } else {
      this._removeListener = AccountManager.addListener(() => {
        if (AccountManager.loggedInGoogle) {
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