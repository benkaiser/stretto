import Song from '../models/song';
let songListeners = [];
let stateListeners = [];
let player;

class Player {
  static get() {
    if (!player) {
      player = new Player();
    }
    return player;
  }

  static addOnSongChangeListener(listener) {
    songListeners.push(listener);
  }

  static addOnStateChangeListener(listener) {
    stateListeners.push(listener);
  }

  static currentSong() {
    return this.get().currentSong;
  }

  static initialise() {
  }

  static isPlaying() {
    return this.get().isPlaying;
  }

  static play(song) {
    this.get().play(song);
  }

  static songChange(newSong) {
    songListeners.forEach((listener) => {
      listener(newSong);
    });
  }

  static stateChange() {
    stateListeners.forEach((listener) => {
      listener();
    });
  }

  static togglePlaying() {
    this.get().togglePlaying();
  }

  isPlaying() {
    return this.isPlaying;
  }

  onYoutubePlayerError(event) {
  }

  onYoutubePlayerReady(event) {
  }

  onYoutubePlayerStateChange(event) {
    this.isPlaying = this.ytplayer.getPlayerState() == YT.PlayerState.PLAYING;
    Player.stateChange();
  }

  play(song, playlist) {
    if (this.currentSong && this.currentSong.id == song.id) {
      return;
    }
    this.updateSong(song);
    if (playlist) {
      this.playlist = playlist;
    }

    if (this.currentSong.isYoutube) {
      this.ytplayer.loadVideoById(song.originalId, 0, 'default');
    }
  }

  setupYoutube() {
    this.ytplayer = new YT.Player('player', {
      height: '480',
      width: '853',
      videoId: '',
      events: {
        onError: this.onYoutubePlayerError.bind(this),
        onReady: this.onYoutubePlayerReady.bind(this),
        onStateChange: this.onYoutubePlayerStateChange.bind(this),
      },
    });
  }

  togglePlaying() {
    if (this.isPlaying) {
      this.ytplayer.pauseVideo();
    } else {
      this.ytplayer.playVideo();
    }
  }

  updateSong(song) {
    this.currentSong = song;
    Player.songChange(this.currentSong);
  }
}

window.onYouTubeIframeAPIReady = () => {
  Player.get().setupYoutube();
};

window.Player = Player;
module.exports = Player;
