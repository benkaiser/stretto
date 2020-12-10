let player;

export default class HTML5AudioPlayer {
  constructor(song, options = {}) {
    this.disposed = false;
    if (options.autoPlay === undefined) options.autoPlay = true;
    player = document.createElement('audio');
    player.setAttribute('class', 'html5audio');
    player.setAttribute('src', '/offlineaudio/' + song.originalId);
    if (options.autoPlay) {
      player.setAttribute('autoplay', 'true');
    }
    document.body.appendChild(player);
    player.onloadeddata = () => {
      if (this.disposed) {
        return;
      }
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
    player.onended = HTML5AudioPlayer.endHandler;
    player.onpause = () => HTML5AudioPlayer.playstateChangeHandler(false);
    player.onplaying = () => HTML5AudioPlayer.playstateChangeHandler(true);
  }

  get durationCacheSeconds() {
    return player.duration;
  }

  dispose() {
    this.disposed = true;
    player && player.pause() && player.remove(player);
    document.querySelectorAll(".html5audio").forEach(e => e.remove());
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

  ensurePlaying() {
    player && player.play();
  }

  static injectHandlers(playstateChange, onEnded) {
    HTML5AudioPlayer.playstateChangeHandler = playstateChange;
    HTML5AudioPlayer.endHandler = onEnded;
  }
}
