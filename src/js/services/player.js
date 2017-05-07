import DataLayer from '../models/data_layer';
import Playlist from '../models/playlist';
import Song from '../models/song';
import SoundcloudPlayer from './soundcloud_player';
import YoutubePlayer from './youtube_player';
import autobind from 'autobind-decorator';

class Player {
  constructor() {
    this.songListeners = [];
    this.stateListeners = [];
    this.repeat_state = this.REPEAT.ALL;
    this.shuffle_on = false;
    YoutubePlayer.injectHandlers(this.playstateChange, this.songEnded);
    SoundcloudPlayer.injectHandlers(this.playstateChange, this.songEnded);
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

  getPlayerFor(song, options) {
    if (song.isYoutube) {
      return new YoutubePlayer(song, options);
    } else if (song.isSoundcloud) {
      return new SoundcloudPlayer(song, options);
    }
  }

  isPlaying() {
    return this.isPlaying;
  }

  @autobind
  next() {
    if (this.repeat_state == this.REPEAT.ONE) {
      this.setCurrentTime(0)
      return;
    }
    this.play(this.playlist.nextSong(this.currentSong, this.shuffle_on));
  }

  play(song, playlist, options) {
    if (this.currentSong && this.currentSong.id == song.id) {
      return;
    }
    this.updateSong(song);
    if (playlist) {
      this.playlist = playlist;
    }

    this.currentPlayer && this.currentPlayer.dispose();
    this.currentPlayer = this.getPlayerFor(this.currentSong, options);
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
    this.songListeners.splice(this.songListeners.indexOf(listener), 1);
  }

  resumeOnLoad(listener) {
    let playstate = DataLayer.getItem('playstate');
    playstate &&
      this.play(
        Song.findById(playstate.songId),
        Playlist.getByTitle(playstate.playlistTitle),
        {
          autoPlay: playstate.playing,
          currentTime: playstate.currentTime,
        }
      );
    playstate && playstate.repeat && (this.repeat_state = playstate.repeat);
    playstate && playstate.shuffle_on && (this.shuffle_on = playstate.shuffle_on);
  }

  saveState() {
    if (document.hidden) return;
    this.currentTimeAbsolute().then((currentTime) => {
      DataLayer.setItem('playstate', {
        currentTime: currentTime,
        playlistTitle: this.playlist.title,
        playing: this.isPlaying,
        repeat: this.repeat_state,
        shuffle_on: this.shuffle_on,
        songId: this.currentSong.id
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
    this.songChange(this.currentSong);
  }
}

let instance = new Player();

window.Player = Player;
module.exports = instance;
