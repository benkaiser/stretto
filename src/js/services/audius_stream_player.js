import Audius from './audius';
import AbstractHTML5AudioPlayer from './abstract_html5_audio_player';

export default class AudiusStreamPlayer extends AbstractHTML5AudioPlayer {
  constructor(song, options = {}) {
    super();
    this.disposed = false;
    this.player = document.createElement('audio');
    if (options.autoPlay === undefined) options.autoPlay = true;
    Audius.getSong(song.originalId)
    .then(songUrl => this.startPlayer(songUrl, song, options));
  }

  startPlayer(songUrl, song, options) {
    this.player.setAttribute('class', 'html5audio');
    this.player.setAttribute('src', songUrl);
    if (song.inLibrary) {
      this.player.setAttribute('src', `/offlineaudio/${song.originalId}?src=${encodeURIComponent(songUrl)}`);
    } else {
      this.player.setAttribute('src', songUrl);
    }
    if (options.volume) {
      this.player.volume = options.volume;
    }
    if (options.autoPlay) {
      this.player.setAttribute('autoplay', 'true');
    }
    document.body.appendChild(this.player);
    this.player.onloadeddata = () => {
      if (this.disposed) {
        return;
      }
      if (options.currentTime) {
        this.player.currentTime = options.currentTime;
      }
      if (options.autoPlay) {
        try {
          this.player.play();
        } catch (_) {
          // no-op
        }
      }
    }
    this.player.onended = AudiusStreamPlayer.endHandler;
    this.player.onpause = () => AudiusStreamPlayer.playstateChangeHandler(false);
    this.player.onplaying = () => AudiusStreamPlayer.playstateChangeHandler(true);
  }

  static injectHandlers(playstateChange, onEnded) {
    AudiusStreamPlayer.playstateChangeHandler = playstateChange;
    AudiusStreamPlayer.endHandler = onEnded;
  }
}
