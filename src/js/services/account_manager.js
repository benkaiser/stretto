export default class AccountManager {
  static initialise() {
    this.setupGoogleLibrary();
  }

  static authServer() {
    fetch('/login', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        email: AccountManager.user.getBasicProfile().getEmail(),
        token: AccountManager.user.getAuthResponse().id_token
      })
    })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    });
  }

  static setupGoogleLibrary() {
    gapi.load('auth2', this.initSigninV2);
  }


  static initSigninV2() {
    AccountManager.auth2 = gapi.auth2.init({
      client_id: `${env.GOOGLE_CLIENT_ID}.apps.googleusercontent.com`,
      scope: 'profile'
    });
  }

  static setUser(googleUser) {
    AccountManager.user = googleUser;
    AccountManager.authServer();
    return AccountManager.user.getBasicProfile().getEmail();
  }
}
