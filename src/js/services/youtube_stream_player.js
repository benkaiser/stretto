let player;

export default class YoutubeStreamPlayer {
  constructor(song, options = {}) {
    if (options.autoPlay === undefined) options.autoPlay = true;
    player = document.createElement('audio');
    if (options.autoPlay) {
      player.setAttribute('autoplay', 'true');
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
    chrome.runtime.sendMessage(youtubeExtractorExtensionId, {
      type: 'YOUTUBE_AUDIO_FETCH',
      payload: 'https://youtube.com/watch?v=' + song.originalId
    }, (format) => {
      player.setAttribute('src', `http://localhost:3000/offlineaudio/${song.originalId}?src=${encodeURIComponent(format.url)}`);
    });
  }

  get durationCacheSeconds() {
    return player.duration;
  }

  dispose() {
    player.parentNode.removeChild(player);
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

  toggle() {
    player.paused ? player.play() : player.pause();
  }

  static injectHandlers(playstateChange, onEnded) {
    YoutubeStreamPlayer.playstateChangeHandler = playstateChange;
    YoutubeStreamPlayer.endHandler = onEnded;
  }
}
