import Theme from './theme';
import RootView from './views/root';

class Loader {
  static loadAll() {
    Theme.initialise();
    RootView.initialise();
  }
}

Loader.loadAll();
