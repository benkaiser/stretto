import Song from '../models/song';
let listeners = [];
let player;

class Player {
  static get() {
    if (!player) {
      player = new Player();
    }
    return player;
  }

  static addOnSongChangeListener(listener) {
    listeners.push(listener);
  }

  static currentSong() {
    return this.get().currentSong;
  }

  static initialise() {
  }

  static play(song) {
    this.get().play(song);
  }

  static songChange(newSong) {
    listeners.forEach((listener) => {
      listener(newSong);
    });
  }

  onYoutubePlayerError(event) {
  }

  onYoutubePlayerReady(event) {
  }

  onYoutubePlayerStateChange(event) {
  }

  play(song) {
    console.log(song);
    if (this.currentSong && this.currentSong.id == song.id) {
      return;
    }
    this.updateSong(song);

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
