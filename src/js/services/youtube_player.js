import autobind from 'autobind-decorator';

export default class YoutubePlayer {
  constructor(song) {
    YoutubePlayer.player.loadVideoById(song.originalId, 0, 'default');
  }

  dispose() {
    YoutubePlayer.player.stopVideo();
  }

  getPosition() {
    return Promise.resolve(YoutubePlayer.player.getCurrentTime() / YoutubePlayer.player.getDuration());
  }

  setCurrentTime(timeFraction) {
    YoutubePlayer.player.seekTo(timeFraction * YoutubePlayer.player.getDuration());
  }

  toggle() {
    YoutubePlayer.isPlaying() ? YoutubePlayer.player.pauseVideo() : YoutubePlayer.player.playVideo();
  }

  static injectHandlers(playstateChange, onEnded) {
    YoutubePlayer.playstateChangeHandler = playstateChange;
    YoutubePlayer.endHandler = onEnded;
  }

  static isPlaying() {
    return YoutubePlayer.player.getPlayerState() === YT.PlayerState.PLAYING;
  }

  static setupYoutube() {
    YoutubePlayer.player = new YT.Player('ytplayer', {
      height: '480',
      width: '853',
      videoId: '',
      events: {
        onError: YoutubePlayer.onYoutubePlayerError,
        onReady: YoutubePlayer.onYoutubePlayerReady,
        onStateChange: YoutubePlayer.onYoutubePlayerStateChange,
      },
    });
  }


  static onYoutubePlayerError(event) {
    // TODO: handle
  }

  static onYoutubePlayerReady(event) {
    // TODO: handle
  }

  static onYoutubePlayerStateChange(event) {
    YoutubePlayer.playstateChangeHandler(YoutubePlayer.isPlaying())
    YoutubePlayer.player.getPlayerState() === YT.PlayerState.ENDED && YoutubePlayer.endHandler();
  }
}

window.onYouTubeIframeAPIReady = () => {
  YoutubePlayer.setupYoutube();
};
