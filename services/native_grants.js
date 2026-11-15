const crypto = require('crypto');
const mongoose = require('mongoose');

const GRANT_TTL_MS = 90 * 1000;
const FLOW_TTL_MS = 10 * 60 * 1000;
const encode = buffer => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = () => encode(crypto.randomBytes(32));
const hash = value => encode(crypto.createHash('sha256').update(value).digest());
const validState = value => typeof value === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(value);
const validChallenge = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value) &&
  encode(Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')) === value;
const validVerifier = value => typeof value === 'string' && /^[A-Za-z0-9._~-]{43,128}$/.test(value);

class MongoGrantStore {
  constructor() {
    const schema = new mongoose.Schema({
      _id: String,
      kind: String,
      stateHash: String,
      challenge: String,
      payload: mongoose.Schema.Types.Mixed,
      expiresAt: Date
    }, { versionKey: false });
    schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    this.model = mongoose.models.NativeGrant || mongoose.model('NativeGrant', schema);
  }

  async insert(grant) {
    await this.model.create(grant);
  }

  async consume(query) {
    return this.model.findOneAndDelete(query).lean().exec();
  }
}

class NativeGrants {
  constructor(store = new MongoGrantStore(), now = Date.now) {
    this.store = store;
    this.now = now;
  }

  async issue(kind, flow, payload) {
    const code = random();
    await this.store.insert({
      _id: hash(code),
      kind,
      stateHash: hash(flow.state),
      challenge: flow.challenge,
      payload,
      expiresAt: new Date(this.now() + GRANT_TTL_MS)
    });
    return code;
  }

  async consume(kind, body) {
    if (!body || !validState(body.code) || body.code.length !== 43 ||
        !validState(body.state) || !validVerifier(body.code_verifier)) return null;
    const query = {
      _id: hash(body.code),
      kind,
      stateHash: hash(body.state),
      challenge: hash(body.code_verifier),
      expiresAt: { $gt: new Date(this.now()) }
    };
    const grant = await this.store.consume(query);
    return grant && grant.payload;
  }
}

module.exports = {
  NativeGrants, MongoGrantStore, GRANT_TTL_MS, FLOW_TTL_MS,
  random, hash, validState, validChallenge, validVerifier
};
