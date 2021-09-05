export default class AbstractHTML5AudioPlayer {
  constructor() {
    /* empty, meant to be inherited */
  }

  get durationCacheSeconds() {
    return this.player.duration;
  }

  dispose() {
    this.disposed = true;
    if (this.player) {
      this.player.pause();
      this.player.remove();
    }
    document.querySelectorAll(".html5audio").forEach(e => {
      e.pause();
      e.remove();
    });
  }

  setVolume(volume) {
    this.player.volume = volume;
  }

  getPosition() {
    return Promise.resolve(this.player.currentTime);
  }

  getPositionFraction() {
    return Promise.resolve(Number.isNaN(this.player.duration) ? 0 : this.player.currentTime / this.player.duration);
  }

  setCurrentTime(timeFraction) {
    this.player.currentTime = this.player.duration * timeFraction;
  }

  toggle() {
    this.player.paused ? this.player.play() : this.player.pause();
  }

  ensurePlaying() {
    this.player && this.player.play();
  }
}
