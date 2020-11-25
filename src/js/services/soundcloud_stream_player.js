import Hls from 'hls.js/dist/hls.light';
import SoundcloudDownloader from './soundcloud_downloader';

let player;

export default class SoundcloudStreamPlayer {
  constructor(song, options = {}) {
    if (options.autoPlay === undefined) options.autoPlay = true;
    this.dirtySeek = options.currentTime ? true : false;
    this.options = options;
    this.song = song;
    SoundcloudDownloader.getInfo(song.url)
    .then(soundcloudInfo => {
      this._setupHLSPlayer(soundcloudInfo.stream.url);
    });
  }

  _setupHLSPlayer(hlsurl) {
    this.audioBuffer = [];
    player = document.createElement('audio');
    if (this.options.autoPlay) {
      player.setAttribute('autoplay', 'true');
    }
    document.body.appendChild(player);
    player.onloadeddata = () => {
      if (this.options.currentTime) {
        player.currentTime = this.options.currentTime;
      }
      if (this.options.autoPlay) {
        try {
          player.play();
        } catch (_) {
          // no-op
        }
      }
    }
    player.onended = SoundcloudStreamPlayer.endHandler;
    player.onpause = () => SoundcloudStreamPlayer.playstateChangeHandler(false);
    player.onplaying = () => SoundcloudStreamPlayer.playstateChangeHandler(true);
    var hls = new Hls();
    hls.attachMedia(player);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(hlsurl);
      hls.on(Hls.Events.BUFFER_APPENDING, (_, data) => {
        console.log('Appended to buffer');
        this.audioBuffer.push(data.data);
      });
      hls.on(Hls.Events.BUFFER_EOS, () => {
        console.log('Buffer end of stream');
        if (!this.dirtySeek) {
          console.log('saving');
          this._saveForOffline();
        }
      });
    });
  }

  _saveForOffline() {
    this.song.cacheOffline(this._arrayConcat(this.audioBuffer));
  }

  _arrayConcat(inputArray) {
    const totalLength = inputArray.reduce(function (prev, cur) {
      return prev + cur.length;
    }, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    inputArray.forEach(function (element) {
      result.set(element, offset);
      offset += element.length;
    });
    return result;
  }

  get durationCacheSeconds() {
    return player ? player.duration : 0;
  }

  dispose() {
    player && player.parentNode.removeChild(player);
  }

  getPosition() {
    return Promise.resolve(player ? player.currentTime : 0);
  }

  getPositionFraction() {
    return player ? Promise.resolve(Number.isNaN(player.duration) ? 0 : player.currentTime / player.duration): Promise.resolve(0);
  }

  setCurrentTime(timeFraction) {
    this.dirtySeek = true;
    if (player) {
      player.currentTime = player.duration * timeFraction;
    }
  }

  toggle() {
    if (player) {
      player.paused ? player.play() : player.pause();
    }
  }

  static injectHandlers(playstateChange, onEnded) {
    SoundcloudStreamPlayer.playstateChangeHandler = playstateChange;
    SoundcloudStreamPlayer.endHandler = onEnded;
  }
}
