import Song from '../models/song';
import SoundcloudPlayer from './soundcloud_player';
import YoutubePlayer from './youtube_player';
import autobind from 'autobind-decorator';

class Player {
  constructor() {
    this.songListeners = [];
    this.stateListeners = [];
    YoutubePlayer.injectHandlers(this.playstateChange, this.songEnded);
    SoundcloudPlayer.injectHandlers(this.playstateChange, this.songEnded);
  }

  addOnSongChangeListener(listener) {
    this.songListeners.push(listener);
  }

  addOnStateChangeListener(listener) {
    this.stateListeners.push(listener);
  }

  currentTime() {
    return this.currentPlayer ?
      this.currentPlayer.getPosition() :
      Promise.resolve(0);
  }

  getPlayerFor(song) {
    if (song.isYoutube) {
      return new YoutubePlayer(song);
    } else if (song.isSoundcloud) {
      return new SoundcloudPlayer(song);
    }
  }

  isPlaying() {
    return this.isPlaying;
  }

  next() {
    let nextIndex = (this.songIndex() + 1) % this.playlist.songs.length;
    this.play(this.playlist.songData[nextIndex]);
  }

  play(song, playlist) {
    if (this.currentSong && this.currentSong.id == song.id) {
      return;
    }
    this.updateSong(song);
    if (playlist) {
      this.playlist = playlist;
    }

    this.currentPlayer && this.currentPlayer.dispose();
    this.currentPlayer = this.getPlayerFor(this.currentSong);
  }

  @autobind
  playstateChange(isPlaying) {
    const oldisPlaying = this.isPlaying;
    this.isPlaying = isPlaying;
    oldisPlaying != isPlaying && this.stateChange();
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

  songIndex() {
    return this.playlist.indexOf(this.currentSong);
  }

  stateChange() {
    this.stateListeners.forEach((listener) => {
      listener();
    });
  }

  togglePlaying() {
    this.currentPlayer && this.currentPlayer.toggle();
  }

  updateSong(song) {
    this.currentSong = song;
    this.songChange(this.currentSong);
  }
}

let instance = new Player();

window.Player = Player;
module.exports = instance;
