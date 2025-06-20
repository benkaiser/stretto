import { Button } from 'react-bootstrap';
import getHistory from 'react-router-global-history';
import Alerter from './alerter';

// Always define readyPromise and readyResolve at the top
let readyResolve;
let readyPromise = new Promise((resolve) => {
  readyResolve = resolve;
});

function globalYTReady() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
    }
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    }
  });
}

export default class YoutubeIframePlayer {
  constructor(song, options = {}) {
    if (options.autoPlay === undefined) options.autoPlay = true;
    options.currentTime = options.currentTime || 0;
    // Only run setupYoutube the first time
    if (!YoutubeIframePlayer._initialized) {
      YoutubeIframePlayer._initialized = true;
      YoutubeIframePlayer.setupYoutube(song.originalId);
    }
    (async () => {
      await YoutubeIframePlayer.readyPromise();
      YoutubeIframePlayer.song = song;
      YoutubeIframePlayer.player.loadVideoById(song.originalId, options.currentTime, 'default');
    })();
  }

  get durationCacheSeconds() {
    return this._lastDuration;
  }

  dispose() {
    YoutubeIframePlayer.player && YoutubeIframePlayer.player.stopVideo();
  }

  getDuration() {
    return this._lastDuration = YoutubeIframePlayer.player.getDuration();
  }

  async getPosition() {
    await YoutubeIframePlayer.readyPromise();
    return YoutubeIframePlayer.player.getCurrentTime();
  }

  async getPositionFraction() {
    await YoutubeIframePlayer.readyPromise();
    return YoutubeIframePlayer.player.getCurrentTime() / this.getDuration();
  }

  async setCurrentTime(timeFraction) {
    await YoutubeIframePlayer.readyPromise();
    YoutubeIframePlayer.player.seekTo(timeFraction * YoutubeIframePlayer.player.getDuration());
  }

  async toggle() {
    await YoutubeIframePlayer.readyPromise();
    YoutubeIframePlayer.isPlaying() ? YoutubeIframePlayer.player.pauseVideo() : YoutubeIframePlayer.player.playVideo();
  }

  static injectHandlers(playstateChange, onEnded) {
    YoutubeIframePlayer.playstateChangeHandler = playstateChange;
    YoutubeIframePlayer.endHandler = onEnded;
  }

  static isPlaying() {
    return YoutubeIframePlayer.player.getPlayerState() === window.YT.PlayerState.PLAYING;
  }

  static readyPromise() {
    return readyPromise;
  }

  static async setupYoutube(sampleVideoId = 'XqZsoesa55w') {
    await globalYTReady();
    if (!document.getElementById('ytplayer')) {
      const div = document.createElement('div');
      div.id = 'ytplayer';
      div.style.display = 'none';
      document.body.appendChild(div);
    }
    YoutubeIframePlayer.player = new window.YT.Player('ytplayer', {
      height: '480',
      width: '853',
      videoId: sampleVideoId,
      events: {
        onError: YoutubeIframePlayer.onYoutubePlayerError,
        onReady: YoutubeIframePlayer.onYoutubePlayerReady,
        onStateChange: YoutubeIframePlayer.onYoutubePlayerStateChange,
      },
    });
  }

  static onYoutubePlayerError(error) {
    const errorSong = YoutubeIframePlayer.song;
    errorSong && Alerter.error(
      <p>
        Unable to play youtube backing track.
        <Button onClick={() => {
          window.lastRoute = getHistory().location.pathname;
          getHistory().push('/edit/' + errorSong.id);
        }}>Edit Track</Button>
      </p>
    );
    console.error(`Youtube playback error: ${error.data}`);
    console.error(error);
    YoutubeIframePlayer.endHandler && YoutubeIframePlayer.endHandler();
  }

  static onYoutubePlayerReady(event) {
    readyResolve();
  }

  static onYoutubePlayerStateChange(event) {
    YoutubeIframePlayer.playstateChangeHandler && YoutubeIframePlayer.playstateChangeHandler(YoutubeIframePlayer.isPlaying());
    YoutubeIframePlayer.player.getPlayerState() === window.YT.PlayerState.ENDED && YoutubeIframePlayer.endHandler && YoutubeIframePlayer.endHandler();
  }
}
