import autobind from 'autobind-decorator';
import DataLayer from '../models/data_layer';
import Playlist from '../models/playlist';
import Song from '../models/song';
import HTML5AudioPlayer from './html5_audio_player';
import SoundcloudStreamPlayer from './soundcloud_stream_player';
import YoutubeStreamPlayer from './youtube_stream_player';
import ServiceWorkerClient from './service_worker_client';

class Player {
  constructor() {
    this.songListeners = [];
    this.stateListeners = [];
    this.repeat_state = this.REPEAT.ALL;
    this.shuffle_on = false;
    HTML5AudioPlayer.injectHandlers(this.playstateChange, this.songEnded);
    SoundcloudStreamPlayer.injectHandlers(this.playstateChange, this.songEnded);
    YoutubeStreamPlayer.injectHandlers(this.playstateChange, this.songEnded);
    this.setupMediaHandler();
  }

  get REPEAT() {
    return {
      ALL: 'all',
      ONE: 'one'
    }
  }

  addOnSongChangeListener(listener) {
    this.songListeners.push(listener);
  }

  addOnStateChangeListener(listener) {
    this.stateListeners.push(listener);
  }

  currentTime() {
    this.saveState();
    return this.currentPlayer ?
      this.currentPlayer.getPositionFraction() :
      Promise.resolve(0);
  }

  currentTimeAbsolute() {
    return this.currentPlayer ?
      this.currentPlayer.getPosition() :
      Promise.resolve(0);
  }

  duration() {
    return this.currentPlayer && this.currentPlayer.durationCacheSeconds || 0;
  }

  getPlayerFor(song, options) {
    if (song.offline) {
      return new HTML5AudioPlayer(song, options);
    }
    if (song.isYoutube) {
      return new YoutubeStreamPlayer(song, options);
    } else if (song.isSoundcloud) {
      return new SoundcloudStreamPlayer(song, options);
    }
  }

  isPlaying() {
    return this.isPlaying;
  }

  @autobind
  next() {
    if (this.repeat_state == this.REPEAT.ONE) {
      this.setCurrentTime(0);
      this.ensurePlaying();
      return;
    }
    this.play(this.playlist.nextSong(this.currentSong, this.shuffle_on));
  }

  play(song, playlist, options) {
    if (playlist) {
      this.playlist = playlist;
    }
    if (this.currentSong && this.currentSong.id == song.id) {
      return Promise.resolve();
    }
    this.updateSong(song);

    this.currentPlayer && this.currentPlayer.dispose();
    return (this.currentSong.deferred ? this.currentSong.getTrack() : Promise.resolve(this.currentSong))
    .then((song) => {
      if (song != this.currentSong) {
        return;
      }
      this.currentPlayer = this.getPlayerFor(this.currentSong, options);
    });
  }

  @autobind
  playstateChange(isPlaying) {
    const oldisPlaying = this.isPlaying;
    this.isPlaying = isPlaying;
    oldisPlaying != isPlaying && this.stateChange();
  }

  @autobind
  previous() {
    this.play(this.playlist.previousSong(this.currentSong, this.shuffle_on));
  }

  removeOnSongChangeListener(listener) {
    if (this.songListeners.indexOf(listener) > -1) {
      this.songListeners.splice(this.songListeners.indexOf(listener), 1);
    }
  }

  resumeOnLoad(listener) {
    let playstate = DataLayer.getItem('playstate');
    if (playstate) {
      const song = Song.findById(playstate.songId);
      const playlist = Playlist.getByTitle(playstate.playlistTitle) || Playlist.getByTitle(Playlist.LIBRARY);
      if (song && playlist) {
        const play = () => {
          this.play(
            song,
            playlist,
            {
              autoPlay: playstate.playing,
              currentTime: playstate.currentTime,
            }
          );
        };
        if (ServiceWorkerClient.available()) {
          Song.waitForOffline().then(() => {
            play();
          });
        } else {
          play();
        }
      } else {
        this.playlist = playlist;
      }
    }
    playstate && playstate.repeat && (this.repeat_state = playstate.repeat);
    playstate && playstate.shuffle_on && (this.shuffle_on = playstate.shuffle_on);
  }

  saveState() {
    if (document.hidden) return;
    this.currentTimeAbsolute().then((currentTime) => {
      DataLayer.setItem('playstate', {
        currentTime: currentTime,
        playlistTitle: this.playlist ? this.playlist.title : '',
        playing: this.isPlaying,
        repeat: this.repeat_state,
        shuffle_on: this.shuffle_on,
        songId: this.currentSong && this.currentSong.id || undefined
      });
    })
  }

  setCurrentTime(timeFraction) {
    this.saveState();
    this.currentPlayer && this.currentPlayer.setCurrentTime(timeFraction);
  }

  songChange(newSong) {
    this.songListeners.forEach((listener) => {
      listener(newSong);
    });
  }

  @autobind
  songEnded() {
    this.next();
    this.stateChange();
  }

  stateChange() {
    this.stateListeners.forEach((listener) => {
      listener();
    });
    this.saveState();
  }

  @autobind
  togglePlaying() {
    this.currentPlayer && this.currentPlayer.toggle();
  }

  @autobind
  ensurePlaying() {
    this.currentPlayer && this.currentPlayer.ensurePlaying();
  }

  @autobind
  toggleRepeat() {
    this.repeat_state = Object.values(this.REPEAT)[
      (Object.values(this.REPEAT).indexOf(this.repeat_state) + 1) % Object.values(this.REPEAT).length
    ];
    this.stateChange();
  }

  @autobind
  toggleShuffle() {
    this.shuffle_on = !this.shuffle_on;
    this.stateChange();
  }

  updateSong(song) {
    this.currentSong = song;
    this.updateMediaSession(this.currentSong);
    this.songChange(this.currentSong);
  }

  setupMediaHandler() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        setTimeout(() => {
          this.togglePlaying();
        }, 0);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setTimeout(() => {
          this.togglePlaying();
        }, 0);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.currentTime()
        .then((currentTime) => {
          this.setCurrentTime(Math.min(currentTime - .05, 1));
        });
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.currentTime()
        .then((currentTime) => {
          this.setCurrentTime(Math.min(currentTime + .05, 1));
        });
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }
  }

  updateMediaSession(song) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [{src: song.cover, sizes: '512x512', type: 'image/jpeg'}]
      });
      this.setupMediaHandler();
    }
  }
}

let instance = new Player();

window.Player = Player;
export default instance;
