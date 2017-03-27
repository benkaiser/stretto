import Song from '../models/song';

class Player {
  constructor() {
    this.songListeners = [];
    this.stateListeners = [];
    this.setupSoundcloud();
  }

  addOnSongChangeListener(listener) {
    this.songListeners.push(listener);
  }

  addOnStateChangeListener(listener) {
    this.stateListeners.push(listener);
  }

  currentTime() {
    return new Promise((resolve) => {
      if (this.currentSong.isYoutube) {
        resolve(this.ytplayer.getCurrentTime() / this.ytplayer.getDuration());
      } else {
        this.scplayer.getPosition((position) => {
          this.scplayer.getDuration((duration) => {
            resolve(position / duration);
          })
        });
      }
    });
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
      this.scplayer.pause();
      this.ytplayer.loadVideoById(song.originalId, 0, 'default');
    } else if (this.currentSong.isSoundcloud) {
      this.ytplayer.stopVideo();
      this.scplayer.load(this.currentSong.url, { auto_play: true });
      this.scplayer.play();
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

  setCurrentTime(timeFraction) {
    if (this.currentSong.isYoutube) {
      this.ytplayer.seekTo(timeFraction * this.ytplayer.getDuration());
    } else if (this.currentSong.isSoundcloud) {
      this.scplayer.getDuration((duration) => {
        this.scplayer.seekTo(timeFraction * duration);
      })
    }
  }

  setupSoundcloud() {
    this.scplayer = SC.Widget('scplayer');
    this.scplayer.bind(SC.Widget.Events.PLAY, () => {
      this.isPlaying = true;
      this.stateChange();
    });
    this.scplayer.bind(SC.Widget.Events.PAUSE, () => {
      this.isPlaying = false;
      this.stateChange();
    });
    this.scplayer.bind(SC.Widget.Events.FINISH, () => {
      this.next();
      this.stateChange();
    });
  }

  setupYoutube() {
    this.ytplayer = new YT.Player('ytplayer', {
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
    if (this.currentSong.isYoutube) {
      this.isPlaying ? this.ytplayer.pauseVideo() : this.ytplayer.playVideo();
    } else if (this.currentSong.isSoundcloud) {
      this.scplayer.toggle();
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
