import ModelInitialiser from './models/initialiser';
import Player from './services/player';
import RootView from './views/root';
import Theme from './theme';

class Loader {
  static loadAll() {
    Theme.initialise();
    ModelInitialiser.initialise();
    Player.initialise();
    RootView.initialise();
  }
}

Loader.loadAll();
