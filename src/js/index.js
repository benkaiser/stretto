import AccountManager from './services/account_manager';
import Keyboard from './initialisers/keyboard';
import Lyrics from './services/lyrics';
import ModelInitialiser from './models/initialiser';
import Player from './services/player';
import RootView from './views/root';
import SCSS from '../scss/main.scss';
import Theme from './theme';
import TitleUpdater from './services/title_updater';

class Loader {
  static loadAll() {
    TitleUpdater.initialise();
    AccountManager.initialise();
    Keyboard.initialise();
    Theme.initialise();
    ModelInitialiser.initialise();
    RootView.initialise();
    Lyrics.initialise();
  }
}

Loader.loadAll();
