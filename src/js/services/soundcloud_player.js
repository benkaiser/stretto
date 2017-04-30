export default class SoundcloudPlayer {
  constructor(song, options = {}) {
    if (options.autoPlay === undefined) options.autoPlay = true;
    SoundcloudPlayer.player.load(song.url, {
      auto_play: options.autoPlay,
      callback: () => {
        SoundcloudPlayer.timeToSeek = options.currentTime || 0;
      }
    });
  }

  dispose() {
    SoundcloudPlayer.player.pause();
  }

  getPosition() {
    return new Promise((resolve) => {
      SoundcloudPlayer.player.getPosition((position) => {
        resolve(position);
      });
    });
  }

  getPositionFraction() {
    return new Promise((resolve) => {
      SoundcloudPlayer.player.getPosition((position) => {
        SoundcloudPlayer.player.getDuration((duration) => {
          resolve(position / duration);
        })
      });
    });
  }

  setCurrentTime(timeFraction) {
    SoundcloudPlayer.player.getDuration((duration) => {
      SoundcloudPlayer.player.seekTo(timeFraction * duration);
    })
  }

  toggle() {
    SoundcloudPlayer.player.toggle();
  }

  static injectHandlers(playstateChange, onEnded) {
    SoundcloudPlayer.playstateChangeHandler = playstateChange;
    SoundcloudPlayer.endHandler = onEnded;
  }

  static setupSoundcloud() {
    SoundcloudPlayer.player = SC.Widget('scplayer');
    SoundcloudPlayer.player.bind(SC.Widget.Events.PLAY, () => {
      SoundcloudPlayer.playstateChangeHandler(true);
      if (SoundcloudPlayer.timeToSeek) {
        SoundcloudPlayer.player.seekTo(SoundcloudPlayer.timeToSeek);
        SoundcloudPlayer.timeToSeek = 0;
      }
    });
    SoundcloudPlayer.player.bind(SC.Widget.Events.PAUSE, () => {
      SoundcloudPlayer.playstateChangeHandler(false);
    });
    SoundcloudPlayer.player.bind(SC.Widget.Events.FINISH, () => {
      SoundcloudPlayer.endHandler();
    });
  }
}

SoundcloudPlayer.setupSoundcloud();
