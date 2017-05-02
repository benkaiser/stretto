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

  next() {
    let nextIndex = (this.songIndex() + 1) % this.playlist.songs.length;
    this.play(this.playlist.songData[nextIndex]);
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

  previous() {
    let previousIndex = this.songIndex() === 0 ?
                        this.playlist.songs.length - 1 :
                        this.songIndex() - 1;
    this.play(this.playlist.songData[previousIndex]);
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
  }

  saveState() {
    if (document.hidden) return;
    console.log('saving...' + (+new Date()))
    this.currentTimeAbsolute().then((currentTime) => {
      DataLayer.setItem('playstate', {
        currentTime: currentTime,
        playlistTitle: this.playlist.title,
        playing: this.isPlaying,
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

  songIndex() {
    return this.playlist.indexOf(this.currentSong);
  }

  stateChange() {
    this.stateListeners.forEach((listener) => {
      listener();
    });
    this.saveState();
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
