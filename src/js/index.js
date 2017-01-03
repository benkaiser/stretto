import ModelInitialiser from './models/initialiser';
import RootView from './views/root';
import Theme from './theme';

class Loader {
  static loadAll() {
    Theme.initialise();
    ModelInitialiser.initialise();
    RootView.initialise();
  }
}

Loader.loadAll();
