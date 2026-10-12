const express = require('express');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');
const DataMapper = require('../models/data_mapper');
const {
  NativeGrants, FLOW_TTL_MS, random, hash, validState, validChallenge, validVerifier
} = require('../services/native_grants');

const SPOTIFY_REDIRECT = 'https://next.kaiserapps.com/spotify_callback';
const SPOTIFY_SCOPES = 'playlist-read-private playlist-read-collaborative user-library-read';
const save = req => new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
const regenerate = req => new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));

class NativeError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function createRouter(options = {}) {
  const router = express.Router();
  const env = options.env || process.env;
  const grants = options.grants || new NativeGrants();
  const mapper = options.mapper || DataMapper;
  const now = options.now || Date.now;
  const request = options.fetch || fetch;
  const rawClientId = (env.GOOGLE_CLIENT_ID || '').trim();
  const googleClientId = rawClientId && (rawClientId.endsWith('.apps.googleusercontent.com')
    ? rawClientId : rawClientId + '.apps.googleusercontent.com');
  const google = options.google || new OAuth2Client(googleClientId);
  const buckets = new Map();

  function limited(req, category, maximum) {
    const time = now();
    for (const [key, bucket] of buckets) {
      if (bucket.until <= time) buckets.delete(key);
    }
    const key = category + ':' + req.ip;
    const bucket = buckets.get(key) || { count: 0, until: time + 60000 };
    bucket.count++;
    buckets.set(key, bucket);
    if (bucket.count > maximum || buckets.size > 10000) throw new NativeError(429, 'rate_limited');
  }

  function noCache(res) {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Content-Type-Options', 'nosniff');
  }

  function handle(handler) {
    return (req, res, next) => {
      noCache(res);
      Promise.resolve().then(() => handler(req, res, next)).catch(error => {
        const expected = error instanceof NativeError;
        res.status(expected ? error.status : 503).json({
          success: false, error: expected ? error.code : 'service_unavailable'
        });
      });
    };
  }

  function signedIn(req) {
    if (!req.session.loggedIn || !req.session.user || !req.session.user.email) {
      throw new NativeError(401, 'login_required');
    }
    return req.session.user.email;
  }

  function newFlow(req) {
    const query = req.query;
    if (!validState(query.state) || !validChallenge(query.code_challenge) ||
        query.code_challenge_method !== 'S256') throw new NativeError(400, 'invalid_request');
    return {
      state: query.state, challenge: query.code_challenge, csrf: random(),
      nonce: random(), expiresAt: now() + FLOW_TTL_MS
    };
  }

  function browserFlow(req, kind) {
    const flow = req.session.nativeFlow;
    if (!flow || flow.kind !== kind || flow.expiresAt <= now() ||
        !req.body || req.body.csrf !== flow.csrf) throw new NativeError(400, 'invalid_browser_flow');
    return flow;
  }

  function callback(kind, code, state) {
    // No caller-supplied redirect URI is ever used.
    return 'stretto-native://' + kind + '?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state);
  }

  function renderLogin(req, res, flow) {
    if (!googleClientId && !req.session.loggedIn) throw new NativeError(503, 'google_not_configured');
    res.render('native_login', {
      googleClientId, csrf: flow.csrf, nonce: flow.nonce,
      email: req.session.loggedIn && req.session.user && req.session.user.email
    });
  }

  async function googleUser(req, flow) {
    if (!googleClientId) throw new NativeError(503, 'google_not_configured');
    if (typeof req.body.credential !== 'string' || req.body.credential.length > 16384) {
      throw new NativeError(400, 'invalid_credential');
    }
    let payload;
    try {
      const ticket = await google.verifyIdToken({ idToken: req.body.credential, audience: googleClientId });
      payload = ticket.getPayload();
    } catch (error) {
      throw new NativeError(401, 'invalid_credential');
    }
    if (!payload || payload.aud !== googleClientId || payload.nonce !== flow.nonce ||
        payload.email_verified !== true || typeof payload.email !== 'string' || !payload.email) {
      throw new NativeError(401, 'invalid_credential');
    }
    try {
      return await mapper.getUser(payload.email);
    } catch (error) {
      if (error !== 'No user found with this email.') throw error;
    }
    try {
      return await mapper.createAccountForGoogleUser(payload.email, payload);
    } catch (error) {
      if (error !== 'User already exists, please login.') throw error;
      return mapper.getUser(payload.email);
    }
  }

  function exchangeBody(req) {
    const body = req.body;
    if (!body || !validState(body.code) || body.code.length !== 43 ||
        !validState(body.state) || !validVerifier(body.code_verifier)) {
      throw new NativeError(400, 'invalid_request');
    }
    return body;
  }

  function spotifyConfigured() {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      throw new NativeError(503, 'spotify_not_configured');
    }
  }

  async function spotifyToken(params) {
    spotifyConfigured();
    const response = await request('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(env.SPOTIFY_CLIENT_ID + ':' + env.SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams(params).toString(),
      timeout: 15000,
      size: 65536
    });
    const data = await response.json();
    if (!response.ok || typeof data.access_token !== 'string' || !data.access_token ||
        !Number.isFinite(data.expires_in) || data.expires_in <= 0 ||
        (data.refresh_token !== undefined && typeof data.refresh_token !== 'string')) {
      throw new NativeError(502, 'spotify_token_failed');
    }
    return {
      access_token: data.access_token,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
      expires_in: data.expires_in
    };
  }

  async function startSpotify(req, res, flow) {
    spotifyConfigured();
    const providerVerifier = random();
    req.session.nativeSpotify = {
      ...flow, providerState: random(), providerVerifier
    };
    delete req.session.nativeFlow;
    await save(req);
    const query = new URLSearchParams({
      client_id: env.SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT,
      state: req.session.nativeSpotify.providerState,
      scope: SPOTIFY_SCOPES,
      code_challenge: hash(providerVerifier),
      code_challenge_method: 'S256'
    });
    res.redirect(303, 'https://accounts.spotify.com/authorize?' + query.toString());
  }

  router.get('/native/config', handle((req, res) => {
    res.json({
      youtubeRedirectEndpoint: env.YOUTUBE_REDIRECT_ENDPOINT || '',
      soundcloudClientId: env.SOUNDCLOUD_CLIENT_ID || '',
      spotifyClientId: env.SPOTIFY_CLIENT_ID || ''
    });
  }));

  router.get('/native/login', handle(async (req, res) => {
    limited(req, 'start', 20);
    const flow = { ...newFlow(req), kind: 'auth' };
    req.session.nativeFlow = flow;
    await save(req);
    renderLogin(req, res, flow);
  }));

  router.post('/native/login/complete', handle(async (req, res) => {
    limited(req, 'complete', 20);
    const flow = browserFlow(req, 'auth');
    const user = req.body.use_session === 'true'
      ? await mapper.getUser(signedIn(req)) : await googleUser(req, flow);
    const code = await grants.issue('auth', flow, { email: user.email });
    delete req.session.nativeFlow;
    await save(req);
    res.redirect(303, callback('auth', code, flow.state));
  }));

  router.post('/native/exchange', handle(async (req, res) => {
    limited(req, 'exchange', 30);
    const payload = await grants.consume('auth', exchangeBody(req));
    if (!payload) throw new NativeError(400, 'invalid_grant');
    const user = await mapper.getUser(payload.email);
    await regenerate(req);
    req.session.user = user;
    req.session.loggedIn = true;
    try {
      await save(req);
    } catch (error) {
      // Do not let express-session retry an authenticated save or emit its
      // cookie after the explicit persistence attempt failed.
      req.session = null;
      throw error;
    }
    res.json({ success: true, email: user.email });
  }));

  router.get('/native/spotify/login', handle(async (req, res) => {
    limited(req, 'start', 20);
    spotifyConfigured();
    // Spotify credentials are independent of Stretto. The native caller proves
    // ownership with PKCE at exchange; the browser need not have a Stretto cookie.
    await startSpotify(req, res, { ...newFlow(req), kind: 'spotify' });
  }));

  router.get('/spotify_callback', (req, res, next) => {
    const flow = req.session.nativeSpotify;
    if (!flow || typeof req.query.state !== 'string' || req.query.state !== flow.providerState) return next();
    return handle(async () => {
      limited(req, 'callback', 20);
      delete req.session.nativeSpotify;
      await save(req);
      if (flow.expiresAt <= now()) {
        throw new NativeError(400, 'invalid_browser_flow');
      }
      if (req.query.error) throw new NativeError(400, 'spotify_authorization_denied');
      if (typeof req.query.code !== 'string' || !req.query.code || req.query.code.length > 2048) {
        throw new NativeError(400, 'invalid_request');
      }
      const tokens = await spotifyToken({
        grant_type: 'authorization_code', code: req.query.code,
        redirect_uri: SPOTIFY_REDIRECT, code_verifier: flow.providerVerifier
      });
      if (!tokens.refresh_token) throw new NativeError(502, 'spotify_token_failed');
      const code = await grants.issue('spotify', flow, tokens);
      const location = callback('spotify', code, flow.state);
      res.status(303).location(location).render('native_spotify_callback', { callback: location });
    })(req, res, next);
  });

  router.post('/native/spotify/exchange', handle(async (req, res) => {
    limited(req, 'exchange', 30);
    signedIn(req);
    const tokens = await grants.consume('spotify', exchangeBody(req));
    if (!tokens) throw new NativeError(400, 'invalid_grant');
    res.json(tokens);
  }));

  router.post('/native/spotify/refresh', handle(async (req, res) => {
    signedIn(req);
    limited(req, 'refresh', 10);
    const token = req.body && req.body.refresh_token;
    if (typeof token !== 'string' || !token || token.length > 8192) {
      throw new NativeError(400, 'invalid_request');
    }
    res.json(await spotifyToken({ grant_type: 'refresh_token', refresh_token: token }));
  }));

  return router;
}

module.exports = createRouter();
module.exports.createRouter = createRouter;
