import AbstractHTML5AudioPlayer from "./abstract_html5_audio_player";
import ServiceWorkerClient from './service_worker_client';

export default class HTML5AudioPlayer extends AbstractHTML5AudioPlayer {
  constructor(song, options = {}) {
    super();
    this.disposed = false;
    if (options.autoPlay === undefined) options.autoPlay = true;
    this.player = document.createElement('audio');
    this.player.setAttribute('class', 'html5audio');
    this.player.setAttribute('src', '/offlineaudio/' + song.originalId);
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
    this.player.onended = HTML5AudioPlayer.endHandler;
    this.player.onpause = () => HTML5AudioPlayer.playstateChangeHandler(false);
    this.player.onplaying = () => HTML5AudioPlayer.playstateChangeHandler(true);
    this.player.onerror = () => {
      ServiceWorkerClient.offlineError(song.id);
      song.removeOffline();
      HTML5AudioPlayer.endHandler();
    };
  }

  dispose() {
    this.disposed = true;
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }
    document.querySelectorAll(".html5audio").forEach(e => {
      e.pause();
      e.remove();
    });
  }

  static injectHandlers(playstateChange, onEnded) {
    HTML5AudioPlayer.playstateChangeHandler = playstateChange;
    HTML5AudioPlayer.endHandler = onEnded;
  }
}
