import SyncManager from './sync_manager';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

class AccountManager {
  constructor() {
    this._listeners = [];
    this.whenYoutubeLoaded = new Promise((resolve) => {
      this._resolveYoutubeLoaded = resolve;
    });
    this.whenLoggedIn = new Promise((resolve) => {
      this._resolveLoggedIn = resolve;
    });
  }

  addListener(listener) {
    const index = this._listeners.length;
    this._listeners.push(listener);
    return () => {
      this._listeners.splice(index, 1);
    };
  }

  _notifyListeners() {
    this._listeners.forEach((listener) => {
      try {
        listener();
      } catch (_) {
        /* no-op */
      }
    });
  }

  get loggedInGoogle() {
    return !!this.user;
  }

  get loggedInStretto() {
    return !!this._authenticated;
  }

  get loadedData() {
    return !!this._loaded;
  }

  get email() {
    return this.user.getBasicProfile().getEmail();
  }

  initialise() {
    this._resolvePromise = this._resolvePromise || new Promise((resolve, _) => { this._onResolveLoad = resolve });
    this.setupGoogleLibrary();
    return this._resolvePromise;
  }

  authServer() {
    console.log(`Authenticating ${this.email} with server`);
    fetch('/login', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: this.email,
        token: this._authToken
      })
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.success) {
        this._authenticated = true;
        this._notifyListeners();
        return this.triggerSync();
      }
    });
  }

  @autobind
  initSigninV2() {
    this._onResolveLoad && this._onResolveLoad();
    gapi.client.load('youtube', 'v3', () => {
      this._resolveYoutubeLoaded();
    });
    this.auth2 = gapi.auth2.init({
      client_id: `${env.GOOGLE_CLIENT_ID}.apps.googleusercontent.com`,
      scope: 'https://www.googleapis.com/auth/youtube.readonly'
    });
    this.auth2.currentUser.listen(this.setUser);
  }

  @autobind
  setUser(googleUser) {
    this.user = googleUser;
    this._resolveLoggedIn();
    this._notifyListeners();
    this.authServer();
    return this.email;
  }

  setupGoogleLibrary() {
    gapi.load('auth2:signin2', this.initSigninV2);
  }

  triggerSync() {
    SyncManager.startSync().then(() => {
      this._loaded = true;
      this._notifyListeners();
    });
  }

  get _authToken() {
    return this.user.getAuthResponse().id_token;
  }
}

export default new AccountManager();