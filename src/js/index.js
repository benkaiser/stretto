import AccountManager from './services/account_manager';
import Keyboard from './initialisers/keyboard';
import ModelInitialiser from './models/initialiser';
import Player from './services/player';
import RootView from './views/root';
import Theme from './theme';

class Loader {
  static loadAll() {
    AccountManager.initialise();
    Keyboard.initialise();
    Theme.initialise();
    ModelInitialiser.initialise();
    RootView.initialise();
  }
}

Loader.loadAll();
