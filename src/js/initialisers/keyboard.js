import Player from '../services/player';

const KEYS = {
  SPACE: 32,
  RIGHT_ARROW: 39,
  LEFT_ARROW: 37
};

export default class Keyboard {
  static initialise() {
    this.addHandlers();
  }

  static addHandlers() {
    document.body.onkeydown = (event) => {
      if (event.target.localName == 'input') return;
      let keymap = {
        ' ': (event) => Player.togglePlaying() && event.preventDefault(),
        ArrowRight: Player.next.bind(Player),
        ArrowLeft: Player.previous.bind(Player)
      };

      if (keymap[event.key] !== undefined) {
        keymap[event.key]();
        event.preventDefault();
      }
    };
  }
}
