export default class AbstractHTML5AudioPlayer {
  constructor() {
    /* empty, meant to be inherited */
  }

  // Streams that are still being produced report a growing duration, so subclasses may supply the real one.
  get durationCacheSeconds() {
    return this.knownDuration > 0 ? this.knownDuration : this.player.duration;
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
    const duration = this.durationCacheSeconds;
    return Promise.resolve(!duration || Number.isNaN(duration) ? 0 : this.player.currentTime / duration);
  }

  setCurrentTime(timeFraction) {
    this.player.currentTime = this.durationCacheSeconds * timeFraction;
  }

  toggle() {
    this.player.paused ? this.player.play() : this.player.pause();
  }

  ensurePlaying() {
    this.player && this.player.play();
  }
}
