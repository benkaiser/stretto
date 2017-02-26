import Keyboard from './initialisers/keyboard.js';
import ModelInitialiser from './models/initialiser';
import Player from './services/player';
import RootView from './views/root';
import Theme from './theme';

class Loader {
  static loadAll() {
    Keyboard.initialise();
    Theme.initialise();
    ModelInitialiser.initialise();
    RootView.initialise();
  }
}

Loader.loadAll();
