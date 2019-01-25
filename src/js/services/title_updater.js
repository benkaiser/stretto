import Player from './player';

export default class TitleUpdater {
  static initialise() {
    Player.addOnSongChangeListener(TitleUpdater.updateTitle)
  }

  static updateTitle() {
    if (!Player.currentSong || !Player.currentSong.title || !Player.currentSong.artist) {
      return;
    }
    const title = document.getElementsByTagName('title')[0];
    if (!title) {
      return;
    }
    title.text = Player.currentSong.title + ' - ' + Player.currentSong.artist + ' - Stretto';
  }
}