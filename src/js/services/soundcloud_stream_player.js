import Hls from 'hls.js/dist/hls.light';
import Utilities from '../utilities';
import ServiceWorkerClient from './service_worker_client';
import SoundcloudDownloader from './soundcloud_downloader';

let player;

export default class SoundcloudStreamPlayer {
  constructor(song, options = {}) {
    this.disposed = false;
    if (options.autoPlay === undefined) options.autoPlay = true;
    this.dirtySeek = options.currentTime ? true : false;
    this.options = options;
    this.song = song;
    this._failedCounter = 0;
    SoundcloudDownloader.getInfo(song.url)
    .then(soundcloudInfo => {
      this._setupHLSPlayer(soundcloudInfo.stream.url);
    })
    .catch(error => {
      console.error(error);
      ServiceWorkerClient.soundcloudError(song.originalId);
      SoundcloudStreamPlayer.endHandler();
    });
  }

  _setupHLSPlayer(hlsurl) {
    if (this.disposed) {
      return;
    }
    this.audioBuffer = [];
    player = document.createElement('audio');
    player.setAttribute('class', 'scaudio');
    if (this.options.autoPlay) {
      player.setAttribute('autoplay', 'true');
    }
    if (this.options.volume) {
      player.volume = this.options.volume;
    }
    document.body.appendChild(player);
    player.onloadeddata = () => {
      if (this.disposed) {
        return;
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
    player.onerror = (error) => {
      console.error(error);
      ServiceWorkerClient.streamError(song.id, error);
      SoundcloudStreamPlayer.endHandler();
    };
    var hls = new Hls({
      maxBufferLength: 60,
      maxMaxBufferLength: 60 * 3,
      startPosition: this.options.currentTime
    });
    hls.attachMedia(player);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(hlsurl);
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.log([event, data]);
        if (data.fatal) {
          if (this._failedCounter < 3) {
            this._failedCounter++;
            this.dirtySeek = true;
            SoundcloudDownloader.getInfo(this.song.url)
            .then(soundcloudInfo => {
              this.options.currentTime = player.currentTime;
              this._setupHLSPlayer(soundcloudInfo.stream.url);
            });
          } else {
            SoundcloudStreamPlayer.endHandler();
          }
        }
      });
      hls.on(Hls.Events.BUFFER_APPENDING, (_, data) => {
        this.audioBuffer.push(data.data);
      });
      hls.on(Hls.Events.BUFFER_EOS, () => {
        if (!this.dirtySeek) {
          console.log('Saving soudncloud track, hit EOS and not dirty');
          this._saveForOffline();
        }
      });
    });
  }

  _saveForOffline() {
    this.song.cacheOffline(Utilities.arrayConcat(this.audioBuffer));
  }

  get durationCacheSeconds() {
    return player ? player.duration : 0;
  }

  dispose() {
    this.disposed = true;
    if (player) {
      player.pause();
      player.remove();
      player = null;
    }
    document.querySelectorAll(".scaudio").forEach(e => {
      e.pause();
      e.remove();
    });
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

  setVolume(volume) {
    player.volume = volume;
  }

  toggle() {
    if (player) {
      player.paused ? player.play() : player.pause();
    }
  }

  ensurePlaying() {
    player && player.play();
  }

  static injectHandlers(playstateChange, onEnded) {
    SoundcloudStreamPlayer.playstateChangeHandler = playstateChange;
    SoundcloudStreamPlayer.endHandler = onEnded;
  }
}
