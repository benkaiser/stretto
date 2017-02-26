import Song from '../models/song';

class Player {
  constructor() {
    this.songListeners = [];
    this.stateListeners = [];
  }

  addOnSongChangeListener(listener) {
    this.songListeners.push(listener);
  }

  addOnStateChangeListener(listener) {
    this.stateListeners.push(listener);
  }

  isPlaying() {
    return this.isPlaying;
  }

  next() {
    let nextIndex = (this.songIndex() + 1) % this.playlist.songs.length;
    this.play(this.playlist.songData[nextIndex]);
  }

  onYoutubePlayerError(event) {
  }

  onYoutubePlayerReady(event) {
  }

  onYoutubePlayerStateChange(event) {
    this.isPlaying = this.ytplayer.getPlayerState() === YT.PlayerState.PLAYING;
    this.ytplayer.getPlayerState() === YT.PlayerState.ENDED && this.next();
    this.stateChange();
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

  previous() {
    let previousIndex = this.songIndex() === 0 ?
                        this.playlist.songs.length - 1 :
                        this.songIndex() - 1;
    this.play(this.playlist.songData[previousIndex]);
  }

  removeOnSongChangeListener(listener) {
    this.songListeners.splice(this.songListeners.indexOf(listener), 1);
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


  songChange(newSong) {
    this.songListeners.forEach((listener) => {
      listener(newSong);
    });
  }

  songIndex() {
    return this.playlist.indexOf(this.currentSong);
  }

  stateChange() {
    this.stateListeners.forEach((listener) => {
      listener();
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
    this.songChange(this.currentSong);
  }
}

let instance = new Player();

window.onYouTubeIframeAPIReady = () => {
  instance.setupYoutube();
};

window.Player = Player;
module.exports = instance;
