import SyncManager from './sync_manager';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

class AccountManager {
  constructor() {
    this._listeners = [];
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
    return !!this.googleUser;
  }

  get loggedInStretto() {
    return !!this._authenticated;
  }

  get loadedData() {
    return !!this._loaded;
  }

  get email() {
    return this.strettoEmail;
  }

  initialise() {
    this._resolvePromise = this._resolvePromise || new Promise((resolve, _) => { this._onResolveLoad = resolve });
    this.setupGoogleLibrary();
    this.checkSessionLoggedIn();
    return this._resolvePromise;
  }

  checkSessionLoggedIn() {
    return fetch('/checklogin',  { method: 'POST' })
    .then(Utilities.fetchToJson)
    .then(responseJson => {
      if (responseJson.loggedIn) {
        this._authenticated = true;
        this.strettoEmail = responseJson.email;
        this._notifyListeners();
      }
    });
  }

  getPublicJsonLibrary() {
    return fetch('/publicjsonlibrary',  {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET'
    })
    .then(Utilities.fetchToJson);
  }

  setPublicJsonLibrary(publicJsonLibrary) {
    return fetch('/publicJsonLibrary',  {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ publicJsonLibrary })
    })
    .then(Utilities.fetchToJson)
    .then((responseJson) => {
      return responseJson.publicJsonLibrary;
    });
  }

  createAccount(options) {
    const email = options.email;
    const password = options.password;
    console.log(`Creating account for ${email}`);
    return fetch('/createaccount', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.success) {
        this._authenticated = true;
        this.strettoEmail = email;
        this._notifyListeners();
        return this.triggerSync();
      } else {
        throw new Error(data.errorMessage);
      }
    });
  }

  login(options) {
    const email = options.email;
    const password = options.password;
    console.log(`Authenticating ${email} with server`);
    return fetch('/login', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.success) {
        this._authenticated = true;
        this.strettoEmail = email;
        this._notifyListeners();
        return this.triggerSync();
      } else {
        throw new Error(data.errorMessage);
      }
    });
  }

  logoutFromStretto() {
    return fetch('/logout',  { method: 'POST' })
    .then(response => {
      this._authenticated = false;
      this.strettoEmail = undefined;
    });
  }

  forgotPassword(email) {
    return fetch('/forgotpassword', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: email
      })
    });
  }

  completeReset(email, password, token) {
    return fetch('/completereset', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password,
        token: token
      })
    });
  }

  authServer() {
    console.log(`Authenticating ${this.email} with server`);
    fetch('/googleLogin', {
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
    this.auth2 = gapi.auth2.init({
      client_id: `${env.GOOGLE_CLIENT_ID}.apps.googleusercontent.com`
    });
    this.auth2.currentUser.listen(this.setUser);
  }

  @autobind
  setUser(googleUser) {
    this.googleUser = googleUser;
    this.strettoEmail = googleUser.getBasicProfile().getEmail();
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
    return this.googleUser.getAuthResponse().id_token;
  }
}

export default new AccountManager();