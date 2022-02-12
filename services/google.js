const { OAuth2Client } = require('google-auth-library');

module.exports = class Google {
  constructor(client_id) {
    this.client = new OAuth2Client(
      client_id
    );
    this.client_id = client_id;
  }

  verifyToken(token) {
    return this.client.verifyIdToken({ idToken: token })
    .then(res => res.getPayload());
  }
}
