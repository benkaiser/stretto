import ServiceWorkerClient from './service_worker_client';

let player;

export default class YoutubeStreamPlayer {
  constructor(song, options = {}) {
    this.disposed = false;
    if (options.autoPlay === undefined) options.autoPlay = true;
    player = document.createElement('audio');
    player.setAttribute('class', 'ytaudio');
    if (options.autoPlay) {
      player.setAttribute('autoplay', 'true');
    }
    if (options.volume) {
      player.volume = options.volume;
    }
    document.body.appendChild(player);
    player.onloadeddata = () => {
      if (options.currentTime) {
        player.currentTime = options.currentTime;
      }
      if (options.autoPlay) {
        try {
          player.play();
        } catch (_) {
          // no-op
        }
      }
    }
    player.onended = YoutubeStreamPlayer.endHandler;
    player.onpause = () => YoutubeStreamPlayer.playstateChangeHandler(false);
    player.onplaying = () => YoutubeStreamPlayer.playstateChangeHandler(true);
    chrome.runtime.sendMessage(helperExtensionId, {
      type: 'YOUTUBE_AUDIO_FETCH',
      payload: 'https://youtube.com/watch?v=' + song.originalId
    }, (format) => {
      if (this.disposed) {
        return;
      }
      if (format) {
        // don't auto-offline a track that is not yet in the users library
        if (song.inLibrary) {
          player.setAttribute('src', `/offlineaudio/${song.originalId}?src=${encodeURIComponent(format.url)}`);
        } else {
          player.setAttribute('src', format.url);
        }
      } else {
        ServiceWorkerClient.youtubeError(song.originalId);
        YoutubeStreamPlayer.endHandler();
      }
    });
  }

  get durationCacheSeconds() {
    return player.duration;
  }

  dispose() {
    this.disposed = true;
    if (player) {
      player.pause();
      player.parentNode && player.parentNode.removeChild(player);
    }
    document.querySelectorAll(".ytaudio").forEach(e => {
      e.pause();
      e.parentNode && e.parentNode.removeChild(player)
    });
  }

  getPosition() {
    return Promise.resolve(player.currentTime);
  }

  getPositionFraction() {
    return Promise.resolve(Number.isNaN(player.duration) ? 0 : player.currentTime / player.duration);
  }

  setCurrentTime(timeFraction) {
    player.currentTime = player.duration * timeFraction;
  }

  setVolume(volume) {
    player.volume = volume;
  }

  toggle() {
    player.paused ? player.play() : player.pause();
  }

  ensurePlaying() {
    player && player.play();
  }

  static injectHandlers(playstateChange, onEnded) {
    YoutubeStreamPlayer.playstateChangeHandler = playstateChange;
    YoutubeStreamPlayer.endHandler = onEnded;
  }
}
