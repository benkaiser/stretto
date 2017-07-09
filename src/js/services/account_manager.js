import SyncManager from './sync_manager';
import Utilities from '../utilities';
import autobind from 'autobind-decorator';

export default class AccountManager {
  static initialise() {
    this.setupGoogleLibrary();
  }

  static authServer() {
    console.log(`Authenticating ${AccountManager._email} with server`);
    fetch('/login', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: AccountManager._email,
        token: AccountManager._authToken
      })
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      if (data.success) {
        AccountManager._authenticated = true;
        AccountManager.triggerSync();
      }
    });
  }

  static initSigninV2() {
    gapi.client.load('youtube', 'v3', AccountManager.initYoutubeV3);
    AccountManager.auth2 = gapi.auth2.init({
      client_id: `${env.GOOGLE_CLIENT_ID}.apps.googleusercontent.com`,
      scope: 'https://www.googleapis.com/auth/youtube.readonly'
    });
    AccountManager.auth2.currentUser.listen(AccountManager.setUser);
  }

  static setUser(googleUser) {
    AccountManager.user = googleUser;
    AccountManager.authServer();
    return AccountManager._email;
  }

  static setupGoogleLibrary() {
    gapi.load('auth2:signin2', AccountManager.initSigninV2);
  }

  static triggerSync() {
    SyncManager.startSync();
  }

  static get _authToken() {
    return AccountManager.user.getAuthResponse().id_token;
  }

  static get _email() {
    return AccountManager.user.getBasicProfile().getEmail();
  }
}
