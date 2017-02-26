import $ from 'jquery';
import Player from '../services/player.js';

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
    $('body').keyup((event) => {
      if (event.target.localName == 'input') return;
      let keymap = [];
      keymap[KEYS.SPACE] = Player.togglePlaying.bind(Player);
      keymap[KEYS.RIGHT_ARROW] = Player.next.bind(Player);
      keymap[KEYS.LEFT_ARROW] = Player.previous.bind(Player);

      if (keymap[event.which] !== undefined) {
        keymap[event.which]();
        event.preventDefault();
      }
    });
  }
}
