const GoogleAuth = require('google-auth-library');
const auth = new GoogleAuth;

module.exports = class Google {
  constructor(client_id) {
    this.client = new auth.OAuth2(client_id, '', '');
    this.client_id = client_id;
  }

  verifyToken(token) {
    return new Promise((resolve, reject) => {
      this.client.verifyIdToken(
        token,
        `${this.client_id}.apps.googleusercontent.com`,
        function(error, login) {
          if (error) { return reject(error); }
          resolve(login.getPayload());
        });
    });
  }
}
