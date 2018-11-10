import io from 'socket.io-client';
import AccountManager from './account_manager';
import Player from './player';

class SocketManager {
  constructor() {
    this._socket = io();
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
    })
  }

  join(room) {
    this._socket.emit('joinRoom', room);
  }

  announceControllable() {
    this._socket.emit('controllable');
  }

  sendPlayPause() {
    this._socket.emit('playpause');
  }
}

export default new SocketManager();