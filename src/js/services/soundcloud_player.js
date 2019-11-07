const RESET_URL = 'http://api.soundcloud.com/users/12574060';
import Soundcloud from './soundcloud';
import * as SC from 'soundcloud';

SC.initialize({
  client_id: Soundcloud.client_id,
  redirect_uri: '/'
});

export default class SoundcloudPlayer {
  constructor(song, options = {}) {
    if (options.autoPlay === undefined) options.autoPlay = true;
    SoundcloudPlayer.setupSoundcloud(song).then(() => {
      SoundcloudPlayer.timeToSeek = options.currentTime || 0;
      if (options.autoPlay) {
        SoundcloudPlayer.player.play();
      }
    });
  }

  get durationCacheSeconds() {
    return SoundcloudPlayer.player.getDuration() / 1000;
  }

  dispose() {
    SoundcloudPlayer.player.kill();
  }

  getPosition() {
    return Promise.resolve(SoundcloudPlayer.player ? SoundcloudPlayer.player.currentTime() : 0);
  }

  getPositionFraction() {
    return Promise.resolve(SoundcloudPlayer.player ?
      SoundcloudPlayer.player.currentTime() / SoundcloudPlayer.player.getDuration()
      : 0
    );
  }

  setCurrentTime(timeFraction) {
    const duration = SoundcloudPlayer.player.getDuration();
    SoundcloudPlayer.player.seek(timeFraction * duration);
  }

  toggle() {
    SoundcloudPlayer.player.isPlaying() ? SoundcloudPlayer.player.pause() : SoundcloudPlayer.player.play();
  }

  static injectHandlers(playstateChange, onEnded) {
    SoundcloudPlayer.playstateChangeHandler = playstateChange;
    SoundcloudPlayer.endHandler = onEnded;
  }

  static setupSoundcloud(song) {
    return SC.stream('/tracks/' + song.originalId).then(player => {
      SoundcloudPlayer.player = player;
      player.on('play', () => {
        SoundcloudPlayer.playstateChangeHandler(true);
        if (SoundcloudPlayer.timeToSeek) {
          SoundcloudPlayer.player.seek(SoundcloudPlayer.timeToSeek);
          SoundcloudPlayer.timeToSeek = 0;
          SoundcloudPlayer.player.play();
        }
      });
      player.on('pause', () => {
        SoundcloudPlayer.playstateChangeHandler(false);
      });
      player.on('finish', () => {
        SoundcloudPlayer.endHandler();
      });

      return player;
    }).catch(error => {
      console.error(error);
    });
  }
}
