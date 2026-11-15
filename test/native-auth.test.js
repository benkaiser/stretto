/* Run with: node test/native-auth.test.js (Node 16+). */
const assert = require('assert');
const path = require('path');
const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const { createRouter } = require('../controllers/native');
const {
  NativeGrants, MongoGrantStore, GRANT_TTL_MS, FLOW_TTL_MS, hash, random
} = require('../services/native_grants');

// This store is only for tests. Production always uses MongoGrantStore.
class TestGrantStore {
  constructor() {
    this.rows = new Map();
  }
  async insert(row) {
    this.rows.set(row._id, row);
  }
  async consume(query) {
    const row = this.rows.get(query._id);
    if (!row || row.kind !== query.kind || row.stateHash !== query.stateHash ||
        row.challenge !== query.challenge || row.expiresAt <= query.expiresAt.$gt) return null;
    this.rows.delete(query._id);
    return row;
  }
}

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

function handoffURL(response) {
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.location, null);
  assert(response.headers.get('content-type').includes('text/html'));
  assert(response.text.includes('Open Stretto for Mac'));
  assert(!response.text.includes('window.location'));
  assert(!response.text.includes('http-equiv="refresh"'));
  const match = response.text.match(/href="(stretto-native:[^"]+)"/);
  assert(match, 'A user-activated app link must be rendered');
  return new URL(match[1].replace(/&amp;/g, '&'));
}

async function fixture(envOverrides = {}) {
  let clock = Date.now();
  const env = {
    GOOGLE_CLIENT_ID: 'test-google',
    SPOTIFY_CLIENT_ID: 'test-spotify',
    SPOTIFY_CLIENT_SECRET: 'test-secret',
    YOUTUBE_REDIRECT_ENDPOINT: 'https://youtube.example/stream',
    SOUNDCLOUD_CLIENT_ID: 'public-soundcloud',
    SMTP_PASSWORD: 'not-public',
    MONGO_URL: 'not-public',
    SOUNDCLOUD_REDIRECT_ENDPOINT: 'not-public',
    ...envOverrides
  };
  const grantStore = new TestGrantStore();
  const grants = new NativeGrants(grantStore, () => clock);
  const users = new Map([['existing@example.com', { email: 'existing@example.com', version: -1 }]]);
  const googleCalls = [];
  const spotifyCalls = [];
  const f = {
    env, grantStore, grants, users, googleCalls, spotifyCalls, created: 0,
    advance: ms => { clock += ms; },
    googlePayload: { email: 'existing@example.com', email_verified: true, aud: 'test-google.apps.googleusercontent.com' },
    tokenResponse: { access_token: 'spotify-access', refresh_token: 'spotify-refresh', expires_in: 3600 },
    tokenStatus: 200
  };
  const mapper = {
    async getUser(email) {
      if (f.mapperFailure) throw new Error('sensitive database error');
      if (!users.has(email)) throw 'No user found with this email.';
      return users.get(email);
    },
    async createAccountForGoogleUser(email, payload) {
      f.created++;
      const user = { email, googleObject: payload, version: -1 };
      users.set(email, user);
      return user;
    }
  };
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, '../views'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const sessionStore = new session.MemoryStore();
  const storeSet = sessionStore.set.bind(sessionStore);
  sessionStore.set = (sid, value, callback) => {
    f.sessionSaves = (f.sessionSaves || 0) + 1;
    if (f.failNextSessionSave) {
      f.failNextSessionSave = false;
      return callback(new Error('sensitive session error'));
    }
    return storeSet(sid, value, callback);
  };
  app.use(session({
    name: 'stretto-next', secret: 'test-only', resave: false, saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }, store: sessionStore
  }));
  app.use(createRouter({
    env, grants, mapper, now: () => clock,
    google: {
      async verifyIdToken(options) {
        googleCalls.push(options);
        if (f.googleFailure) throw new Error('sensitive provider error');
        return { getPayload: () => f.googlePayload };
      }
    },
    fetch: async (url, options) => {
      spotifyCalls.push({ url, options });
      if (f.spotifyFailure) throw new Error('sensitive network error');
      return { ok: f.tokenStatus === 200, json: async () => f.tokenResponse };
    }
  }));
  // Exercise the unmodified official callback and session-check routes.
  app.use(require('../controllers'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  f.origin = origin;
  f.close = () => new Promise(resolve => server.close(resolve));
  f.browser = {};
  f.native = {};
  f.request = async (route, { jar = f.browser, method = 'GET', body } = {}) => {
    const headers = {};
    if (jar.cookie) headers.Cookie = jar.cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(origin + route, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual'
    });
    const cookies = response.headers.raw()['set-cookie'] || [];
    if (cookies.length) jar.cookie = cookies[0].split(';')[0];
    const text = await response.text();
    let data;
    if (response.headers.get('content-type') && response.headers.get('content-type').includes('application/json')) {
      data = JSON.parse(text);
    }
    return { status: response.status, text, data, cookies, location: response.headers.get('location'), headers: response.headers };
  };
  f.start = async (kind = 'auth', extra = {}) => {
    const state = random();
    const verifier = random();
    const route = kind === 'auth' ? '/native/login' : '/native/spotify/login';
    const query = new URLSearchParams({
      state, code_challenge: hash(verifier), code_challenge_method: 'S256', ...extra
    });
    const response = await f.request(route + '?' + query);
    const csrfMatch = response.text.match(/name="csrf" value="([^"]+)"/);
    const nonceMatch = response.text.match(/data-nonce="([^"]+)"/);
    if (nonceMatch) f.googlePayload.nonce = nonceMatch[1];
    return { state, verifier, csrf: csrfMatch && csrfMatch[1], response, kind };
  };
  f.complete = flow => f.request(flow.kind === 'auth' ? '/native/login/complete' : '/native/spotify/login/complete', {
    method: 'POST', body: { csrf: flow.csrf, credential: 'test-id-token' }
  });
  f.auth = async () => {
    const flow = await f.start();
    const complete = await f.complete(flow);
    const code = handoffURL(complete).searchParams.get('code');
    const exchange = await f.request('/native/exchange', {
      jar: f.native, method: 'POST', body: { code, state: flow.state, code_verifier: flow.verifier }
    });
    assert.strictEqual(exchange.status, 200);
    return { flow, code, exchange };
  };
  return f;
}

async function withFixture(run, envOverrides) {
  const f = await fixture(envOverrides);
  try { await run(f); } finally { await f.close(); }
}

test('public configuration is an exact allowlist, with no secrets', () => withFixture(async f => {
  const response = await f.request('/native/config');
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(response.data, {
    youtubeRedirectEndpoint: f.env.YOUTUBE_REDIRECT_ENDPOINT,
    soundcloudClientId: f.env.SOUNDCLOUD_CLIENT_ID,
    spotifyClientId: f.env.SPOTIFY_CLIENT_ID
  });
  assert(!response.text.includes('test-secret'));
  assert(!response.text.includes('not-public'));
  assert.strictEqual(response.headers.get('cache-control'), 'no-store');
}));

test('only native login HTML permits an origin-only referrer; APIs, redirects and errors suppress it', () => withFixture(async f => {
  const flow = await f.start();
  assert.strictEqual(flow.response.status, 200);
  assert.strictEqual(flow.response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.strictEqual(flow.response.headers.get('cache-control'), 'no-store');

  const protectedResponse = response => {
    assert.strictEqual(response.headers.get('referrer-policy'), 'no-referrer');
    assert.strictEqual(response.headers.get('cache-control'), 'no-store');
  };
  protectedResponse(await f.request('/native/config'));
  protectedResponse(await f.request('/native/login'));
  protectedResponse(await f.request('/native/login/complete', { method: 'POST', body: {} }));
  const complete = await f.complete(flow);
  assert.strictEqual(complete.status, 200);
  protectedResponse(complete);
  const exchange = await f.request('/native/exchange', {
    jar: f.native, method: 'POST', body: {
      code: handoffURL(complete).searchParams.get('code'),
      state: flow.state, code_verifier: flow.verifier
    }
  });
  assert.strictEqual(exchange.status, 200);
  protectedResponse(exchange);
  const spotify = await f.start('spotify');
  assert.strictEqual(spotify.response.status, 303);
  protectedResponse(spotify.response);
  const providerState = new URL(spotify.response.location).searchParams.get('state');
  const callback = await f.request('/spotify_callback?' + new URLSearchParams({ state: providerState, code: 'provider-code' }));
  assert.strictEqual(callback.status, 200);
  protectedResponse(callback);
  const tokens = await f.request('/native/spotify/exchange', {
    jar: f.native, method: 'POST', body: {
      code: handoffURL(callback).searchParams.get('code'),
      state: spotify.state, code_verifier: spotify.verifier
    }
  });
  assert.strictEqual(tokens.status, 200);
  protectedResponse(tokens);
  const refresh = await f.request('/native/spotify/refresh', {
    jar: f.native, method: 'POST', body: { refresh_token: 'spotify-refresh' }
  });
  assert.strictEqual(refresh.status, 200);
  protectedResponse(refresh);
}));

test('malformed state, PKCE and methods fail on both starts', () => withFixture(async f => {
  for (const kind of ['auth', 'spotify']) {
    for (const extra of [
      { state: 'short' }, { state: 'a'.repeat(257) }, { state: 'a'.repeat(31) + '+' },
      { code_challenge: 'a'.repeat(42) }, { code_challenge: 'a'.repeat(42) + '/' },
      { code_challenge: 'a'.repeat(42) + 'B' }, { code_challenge_method: 'plain' }
    ]) {
      const flow = await f.start(kind, extra);
      assert.strictEqual(flow.response.status, 400);
      assert.strictEqual(flow.response.data.error, 'invalid_request');
    }
  }
  assert.strictEqual((await f.request('/native/login')).status, 400);
  assert.strictEqual((await f.request('/native/login?state[]=abc')).status, 400);
}));

test('browser consent, session binding, expiry and Google nonce/audience are mandatory', () => withFixture(async f => {
  const flow = await f.start('auth', { redirect_uri: 'https://evil.example/' });
  assert.strictEqual(flow.response.status, 200);
  assert.strictEqual(flow.response.location, null);
  assert(flow.response.text.includes('test-google.apps.googleusercontent.com'));
  assert(flow.response.text.includes('auto_select: false'));
  assert.strictEqual(f.grantStore.rows.size, 0);
  const body = { csrf: flow.csrf, credential: 'test-id-token' };
  assert.strictEqual((await f.request('/native/login/complete', { method: 'POST', body: {} })).status, 400);
  assert.strictEqual((await f.request('/native/login/complete', { jar: {}, method: 'POST', body })).status, 400);
  assert.strictEqual((await f.request('/native/login/complete', {
    method: 'POST', body: { csrf: flow.csrf, use_session: 'true' }
  })).status, 401);
  f.googlePayload.aud = 'wrong-audience';
  assert.strictEqual((await f.complete(flow)).status, 401);
  f.googlePayload.aud = 'test-google.apps.googleusercontent.com';
  f.googlePayload.nonce = 'wrong-nonce';
  assert.strictEqual((await f.complete(flow)).status, 401);
  f.googlePayload.nonce = flow.response.text.match(/data-nonce="([^"]+)"/)[1];
  f.googlePayload.email_verified = false;
  assert.strictEqual((await f.complete(flow)).status, 401);
  f.googlePayload.email_verified = true;
  f.googleFailure = true;
  const failed = await f.complete(flow);
  assert.strictEqual(failed.status, 401);
  assert(!failed.text.includes('sensitive'));
  f.googleFailure = false;
  f.advance(FLOW_TTL_MS);
  assert.strictEqual((await f.complete(flow)).status, 400);
  assert.strictEqual(f.grantStore.rows.size, 0);
  assert.deepStrictEqual(f.googleCalls[0], {
    idToken: 'test-id-token', audience: 'test-google.apps.googleusercontent.com'
  });
}));

test('existing account grant is PKCE-bound, atomically single-use, and explicitly saves a native cookie', () => withFixture(async f => {
  const flow = await f.start('auth', { redirect_uri: 'https://evil.example/' });
  const complete = await f.complete(flow);
  const location = handoffURL(complete);
  assert.strictEqual(location.protocol, 'stretto-native:');
  assert.strictEqual(location.hostname, 'auth');
  assert.deepStrictEqual([...location.searchParams.keys()], ['code', 'state']);
  assert.strictEqual(location.searchParams.get('state'), flow.state);
  assert(!location.href.includes('test-id-token'));
  assert(!location.href.includes('existing@example.com'));
  const code = location.searchParams.get('code');
  const body = { code, state: flow.state, code_verifier: flow.verifier };
  assert.strictEqual((await f.request('/checklogin', { jar: f.native, method: 'POST', body: {} })).status, 403);
  for (const invalid of [
    { code: 'short' }, { state: 'bad' }, { code_verifier: 'short' },
    { code_verifier: 'a'.repeat(129) }, { code_verifier: 'a'.repeat(42) + '+' }
  ]) {
    assert.strictEqual((await f.request('/native/exchange', {
      jar: f.native, method: 'POST', body: { ...body, ...invalid }
    })).data.error, 'invalid_request');
  }
  for (const invalid of [{ state: random() }, { code_verifier: random() }]) {
    assert.strictEqual((await f.request('/native/exchange', {
      jar: f.native, method: 'POST', body: { ...body, ...invalid }
    })).data.error, 'invalid_grant');
  }
  const oldCookie = f.native.cookie;
  const results = await Promise.all([f.native, {}].map(jar => f.request('/native/exchange', { jar, method: 'POST', body })));
  assert.deepStrictEqual(results.map(result => result.status).sort(), [200, 400]);
  assert.strictEqual(results[0].status, 200);
  assert.deepStrictEqual(results[0].data, { success: true, email: 'existing@example.com' });
  assert(results[0].cookies[0].includes('HttpOnly'));
  assert.notStrictEqual(f.native.cookie, oldCookie);
  assert.deepStrictEqual((await f.request('/checklogin', {
    jar: f.native, method: 'POST', body: {}
  })).data, { loggedIn: true, email: 'existing@example.com' });
  assert.strictEqual((await f.request('/native/exchange', { jar: f.native, method: 'POST', body })).data.error, 'invalid_grant');
  assert.strictEqual(f.created, 0);
}));

test('new Google accounts use official mapping; database failures are not mistaken for missing accounts', () => withFixture(async f => {
  f.googlePayload.email = 'new@example.com';
  const auth = await f.auth();
  assert.strictEqual(auth.exchange.data.email, 'new@example.com');
  assert.strictEqual(f.created, 1);
  assert.strictEqual(f.users.get('new@example.com').googleObject.email_verified, true);
  const flow = await f.start();
  f.mapperFailure = true;
  const response = await f.complete(flow);
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.data.error, 'service_unavailable');
  assert.strictEqual(f.created, 1);
  assert(!response.text.includes('sensitive'));
}));

test('a fully qualified Google client ID is not suffixed twice', () => withFixture(async f => {
  const flow = await f.start();
  assert(flow.response.text.includes('data-client="test-google.apps.googleusercontent.com"'));
  assert(!flow.response.text.includes('.apps.googleusercontent.com.apps.googleusercontent.com'));
  handoffURL(await f.complete(flow));
  assert.strictEqual(f.googleCalls[0].audience, 'test-google.apps.googleusercontent.com');
}, { GOOGLE_CLIENT_ID: 'test-google.apps.googleusercontent.com' }));

test('session persistence failure returns sanitized failure after consuming the grant', () => withFixture(async f => {
  const flow = await f.start();
  const complete = await f.complete(flow);
  const body = {
    code: handoffURL(complete).searchParams.get('code'),
    state: flow.state, code_verifier: flow.verifier
  };
  f.failNextSessionSave = true;
  const result = await f.request('/native/exchange', { jar: f.native, method: 'POST', body });
  assert.strictEqual(result.status, 503);
  assert.deepStrictEqual(result.data, { success: false, error: 'service_unavailable' });
  assert.strictEqual(result.cookies.length, 0);
  assert(!result.text.includes('sensitive'));
  assert.strictEqual(f.grantStore.rows.size, 0);
  assert.strictEqual((await f.request('/checklogin', { jar: f.native, method: 'POST', body: {} })).status, 403);
  assert.strictEqual((await f.request('/native/exchange', { jar: f.native, method: 'POST', body })).data.error, 'invalid_grant');
}));

test('failure to persist a grant never returns a handoff code', () => withFixture(async f => {
  const flow = await f.start();
  f.grantStore.insert = async () => { throw new Error('sensitive database error'); };
  const result = await f.complete(flow);
  assert.strictEqual(result.status, 503);
  assert.strictEqual(result.location, null);
  assert(!result.text.includes('sensitive'));
}));

test('an authenticated web account still requires explicit Continue consent', () => withFixture(async f => {
  await f.auth();
  const verifier = random();
  const state = random();
  const page = await f.request('/native/login?' + new URLSearchParams({
    state, code_challenge: hash(verifier), code_challenge_method: 'S256'
  }), { jar: f.native });
  assert.strictEqual(page.status, 200);
  assert(page.text.includes('Continue as existing@example.com'));
  assert.strictEqual(page.location, null);
  assert.strictEqual(f.grantStore.rows.size, 0);
  const csrf = page.text.match(/name="csrf" value="([^"]+)"/)[1];
  const response = await f.request('/native/login/complete', {
    jar: f.native, method: 'POST', body: { csrf, use_session: 'true' }
  });
  assert.strictEqual(handoffURL(response).hostname, 'auth');
  assert.strictEqual(f.googleCalls.length, 1);
}));

test('grant expiry is enforced even before Mongo TTL cleanup', () => withFixture(async f => {
  const flow = await f.start();
  const complete = await f.complete(flow);
  const code = handoffURL(complete).searchParams.get('code');
  f.advance(GRANT_TTL_MS);
  const response = await f.request('/native/exchange', {
    jar: f.native, method: 'POST', body: { code, state: flow.state, code_verifier: flow.verifier }
  });
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.data.error, 'invalid_grant');
  assert.strictEqual((await f.request('/checklogin', { jar: f.native, method: 'POST', body: {} })).status, 403);
}));

test('Spotify works in a fresh unauthenticated browser with fixed callback, PKCE, replay protection and refresh', () => withFixture(async f => {
  await f.auth();
  f.browser = {};
  const flow = await f.start('spotify');
  const authorize = flow.response;
  assert.strictEqual(authorize.status, 303);
  const provider = new URL(authorize.location);
  assert.strictEqual(provider.origin, 'https://accounts.spotify.com');
  assert.strictEqual(provider.searchParams.get('redirect_uri'), 'https://next.kaiserapps.com/spotify_callback');
  assert.strictEqual(provider.searchParams.get('response_type'), 'code');
  assert.strictEqual(provider.searchParams.get('code_challenge_method'), 'S256');
  assert.notStrictEqual(provider.searchParams.get('state'), flow.state);
  const providerState = provider.searchParams.get('state');
  const untouched = await f.request('/spotify_callback?code=web-code&state=unmatched');
  assert.strictEqual(untouched.status, 200);
  assert(untouched.text.includes('window.opener.SpotifyCallback'));
  assert.strictEqual(f.spotifyCalls.length, 0);
  const response = await f.request('/spotify_callback?' + new URLSearchParams({ state: providerState, code: 'provider-code' }));
  assert.strictEqual(response.status, 200);
  assert(!response.text.includes('spotify-access'));
  assert(!response.text.includes('spotify-refresh'));
  assert(!response.text.includes('provider-code'));
  const location = handoffURL(response);
  assert.strictEqual(location.protocol, 'stretto-native:');
  assert.strictEqual(location.hostname, 'spotify');
  assert.strictEqual(location.searchParams.get('state'), flow.state);
  assert.deepStrictEqual([...location.searchParams.keys()], ['code', 'state']);
  const request = f.spotifyCalls[0];
  assert.strictEqual(request.url, 'https://accounts.spotify.com/api/token');
  assert.strictEqual(request.options.headers.Authorization, 'Basic ' + Buffer.from('test-spotify:test-secret').toString('base64'));
  const params = new URLSearchParams(request.options.body);
  assert.strictEqual(params.get('redirect_uri'), 'https://next.kaiserapps.com/spotify_callback');
  assert.strictEqual(params.get('code'), 'provider-code');
  assert.strictEqual(hash(params.get('code_verifier')), provider.searchParams.get('code_challenge'));
  const body = { code: location.searchParams.get('code'), state: flow.state, code_verifier: flow.verifier };
  assert.strictEqual((await f.request('/native/spotify/exchange', { jar: {}, method: 'POST', body })).status, 401);
  assert.strictEqual((await f.request('/checklogin', { method: 'POST', body: {} })).status, 403);
  assert.strictEqual((await f.request('/native/spotify/exchange', {
    jar: f.native, method: 'POST', body: { ...body, code_verifier: random() }
  })).data.error, 'invalid_grant');
  const exchanged = await f.request('/native/spotify/exchange', { jar: f.native, method: 'POST', body });
  assert.strictEqual(exchanged.status, 200);
  assert.deepStrictEqual(exchanged.data, f.tokenResponse);
  assert.strictEqual((await f.request('/native/spotify/exchange', { jar: f.native, method: 'POST', body })).data.error, 'invalid_grant');
  const replay = await f.request('/spotify_callback?' + new URLSearchParams({ state: providerState, code: 'provider-code' }));
  assert(replay.text.includes('window.opener.SpotifyCallback'));
  assert.strictEqual(f.spotifyCalls.length, 1);
  assert.strictEqual((await f.request('/native/spotify/refresh', { jar: {}, method: 'POST', body: { refresh_token: 'token' } })).status, 401);
  assert.strictEqual((await f.request('/native/spotify/refresh', { jar: f.native, method: 'POST', body: {} })).status, 400);
  f.tokenResponse = { access_token: 'new-access', expires_in: 3600 };
  const refreshed = await f.request('/native/spotify/refresh', {
    jar: f.native, method: 'POST', body: { refresh_token: 'spotify-refresh' }
  });
  assert.deepStrictEqual(refreshed.data, f.tokenResponse);
  const refreshParams = new URLSearchParams(f.spotifyCalls[1].options.body);
  assert.strictEqual(refreshParams.get('grant_type'), 'refresh_token');
  assert.strictEqual(refreshParams.get('refresh_token'), 'spotify-refresh');
}));

test('Spotify callback denial, expiry and provider failures never pretend success', () => withFixture(async f => {
  for (const outcome of ['denied', 'expired', 'provider-error', 'network-error']) {
    const flow = await f.start('spotify');
    const authorize = flow.response;
    const state = new URL(authorize.location).searchParams.get('state');
    if (outcome === 'expired') f.advance(FLOW_TTL_MS);
    f.tokenStatus = outcome === 'provider-error' ? 400 : 200;
    f.tokenResponse = outcome === 'provider-error'
      ? { error: 'invalid_grant', error_description: 'sensitive provider detail' }
      : { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 };
    f.spotifyFailure = outcome === 'network-error';
    const query = new URLSearchParams({ state, ...(outcome === 'denied' ? { error: 'access_denied' } : { code: 'code' }) });
    const response = await f.request('/spotify_callback?' + query);
    assert.strictEqual(response.status, {
      denied: 400, expired: 400, 'provider-error': 502, 'network-error': 503
    }[outcome]);
    assert.strictEqual(response.data.success, false);
    assert(!response.text.includes('sensitive'));
    assert.strictEqual(f.grantStore.rows.size, 0);
  }
}));

test('Spotify start from an authenticated browser works without extra account login', () => withFixture(async f => {
  await f.auth();
  const response = await f.request('/native/spotify/login?' + new URLSearchParams({
    state: random(), code_challenge: hash(random()), code_challenge_method: 'S256',
    redirect_uri: 'stretto-native://evil'
  }), { jar: f.native });
  assert.strictEqual(response.status, 303);
  assert.strictEqual(new URL(response.location).searchParams.get('redirect_uri'), 'https://next.kaiserapps.com/spotify_callback');
}));

test('basic refresh abuse limits are enforced before additional provider calls', () => withFixture(async f => {
  await f.auth();
  for (let i = 0; i < 10; i++) {
    assert.strictEqual((await f.request('/native/spotify/refresh', {
      jar: f.native, method: 'POST', body: { refresh_token: 'token' }
    })).status, 200);
  }
  const limited = await f.request('/native/spotify/refresh', {
    jar: f.native, method: 'POST', body: { refresh_token: 'token' }
  });
  assert.strictEqual(limited.status, 429);
  assert.strictEqual(limited.data.error, 'rate_limited');
  assert.strictEqual(f.spotifyCalls.length, 10);
}));

test('Mongo grants have a TTL index and use one atomic filtered findOneAndDelete', async () => {
  const store = new MongoGrantStore();
  assert(store.model.schema.indexes().some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
  const original = store.model.findOneAndDelete;
  let query;
  store.model.findOneAndDelete = filter => {
    query = filter;
    return { lean: () => ({ exec: async () => ({ payload: { email: 'existing@example.com' } }) }) };
  };
  try {
    const grants = new NativeGrants(store, () => 1000);
    const code = random();
    const verifier = random();
    const state = random();
    assert.deepStrictEqual(await grants.consume('spotify', { code, code_verifier: verifier, state }), {
      email: 'existing@example.com'
    });
    assert.deepStrictEqual(query, {
      _id: hash(code), kind: 'spotify', stateHash: hash(state), challenge: hash(verifier),
      expiresAt: { $gt: new Date(1000) }
    });
  } finally {
    store.model.findOneAndDelete = original;
  }
});

test('persisted grants contain only hashed code/state and are separated by grant type', async () => {
  const store = new TestGrantStore();
  const grants = new NativeGrants(store, () => 1000);
  const state = random();
  const verifier = random();
  const code = await grants.issue('auth', { state, challenge: hash(verifier) }, { email: 'existing@example.com' });
  const row = store.rows.get(hash(code));
  assert(row);
  assert.strictEqual(row.stateHash, hash(state));
  assert.strictEqual(row.expiresAt.getTime(), 1000 + GRANT_TTL_MS);
  assert(!JSON.stringify(row).includes(code));
  assert(!JSON.stringify(row).includes(state));
  assert.strictEqual(await grants.consume('spotify', { code, state, code_verifier: verifier }), null);
  assert.deepStrictEqual(await grants.consume('auth', { code, state, code_verifier: verifier }), { email: 'existing@example.com' });
});

if (process.argv[2]) {
  test('Chrome renders the async Google POST handoff without an external-protocol redirect', () => withFixture(async f => {
    const { chromium } = require(path.resolve(process.argv[2]));
    const browser = await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://accounts.google.com/**', route => route.fulfill({
        contentType: 'application/javascript', body: ''
      }));
      const state = random();
      const verifier = random();
      await page.goto(f.origin + '/native/login?' + new URLSearchParams({
        state, code_challenge: hash(verifier), code_challenge_method: 'S256'
      }));
      f.googlePayload.nonce = await page.locator('#google-login').getAttribute('data-nonce');
      // Match GIS's asynchronous form submission, without a user activation.
      await Promise.all([
        page.waitForURL(f.origin + '/native/login/complete'),
        page.evaluate(() => {
          document.getElementById('credential').value = 'test-id-token';
          document.getElementById('google-form').submit();
        })
      ]);
      const link = page.locator('#native-callback');
      await link.waitFor();
      assert.strictEqual(await page.title(), 'Return to Stretto for Mac');
      const callback = new URL(await link.getAttribute('href'));
      assert.strictEqual(callback.hostname, 'auth');
      assert.strictEqual(callback.searchParams.get('state'), state);
      // Observe the real click without launching or disturbing a running Mac app.
      await link.evaluate(element => element.addEventListener('click', event => {
        event.preventDefault();
        element.dataset.trustedClick = String(event.isTrusted);
      }));
      await link.click();
      assert.strictEqual(await link.getAttribute('data-trusted-click'), 'true');
      const exchanged = await f.request('/native/exchange', {
        jar: f.native, method: 'POST', body: {
          code: callback.searchParams.get('code'), state, code_verifier: verifier
        }
      });
      assert.strictEqual(exchanged.status, 200);
      assert.deepStrictEqual(exchanged.data, { success: true, email: 'existing@example.com' });
      assert.deepStrictEqual(errors, []);
    } finally {
      await browser.close();
    }
  }));
}

(async () => {
  let failed = 0;
  for (const { name, run } of tests) {
    try {
      await run();
      console.log('PASS ' + name);
    } catch (error) {
      failed++;
      console.error('FAIL ' + name);
      console.error(error);
    }
  }
  console.log(`${tests.length - failed}/${tests.length} tests passed`);
  process.exitCode = failed ? 1 : 0;
})();
