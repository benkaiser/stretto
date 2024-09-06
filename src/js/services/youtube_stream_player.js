import AbstractHTML5AudioPlayer from './abstract_html5_audio_player';
import ServiceWorkerClient from './service_worker_client';

export default class YoutubeStreamPlayer extends AbstractHTML5AudioPlayer {
  constructor(song, options = {}) {
    super();
    this.disposed = false;
    this.player = document.createElement('audio');
    if (options.autoPlay === undefined) options.autoPlay = true;
    const url = env.YOUTUBE_REDIRECT_ENDPOINT + '?id=' + song.originalId;
    this.startPlayer(url, song, options);
  }

  startPlayer(songUrl, song, options) {
    this.player.onended = YoutubeStreamPlayer.endHandler;
    this.player.onpause = () => YoutubeStreamPlayer.playstateChangeHandler(false);
    this.player.onplaying = () => YoutubeStreamPlayer.playstateChangeHandler(true);
    this.player.onerror = () => {
      ServiceWorkerClient.offlineError(song.id);
      song.removeOffline();
      YoutubeStreamPlayer.endHandler();
    };
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
  }

  static injectHandlers(playstateChange, onEnded) {
    YoutubeStreamPlayer.playstateChangeHandler = playstateChange;
    YoutubeStreamPlayer.endHandler = onEnded;
  }
}
