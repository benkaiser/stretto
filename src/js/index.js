import AccountManager from './services/account_manager';
import Keyboard from './initialisers/keyboard';
import Lyrics from './services/lyrics';
import ModelInitialiser from './models/initialiser';
import Player from './services/player';
import RootView from './views/root';
import SCSS from '../scss/main.scss';
import Theme from './theme';
import TitleUpdater from './services/title_updater';
import ServiceWorkerClient from './services/service_worker_client';
import FirstRunExperience from './services/first_run_experience';
import SoundcloudOAuth from './services/soundcloud_oauth';

class Loader {
  static loadAll() {
    TitleUpdater.initialise();
    FirstRunExperience.initialise();
    AccountManager.initialise();
    Keyboard.initialise();
    Theme.initialise();
    ModelInitialiser.initialise();
    RootView.initialise();
    Lyrics.initialise();
    ServiceWorkerClient.initialise();
    SoundcloudOAuth.initialise();
  }
}

Loader.loadAll();
