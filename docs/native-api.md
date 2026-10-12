# Native macOS API

Base URL: `https://next.kaiserapps.com`. Additive routes; existing web login,
sync and Spotify callback behavior are unchanged. Use HTTPS and the native HTTP
cookie jar for API calls. No CORS or bearer-token authentication is provided.

## Stretto authentication

1. Generate an unpredictable base64url `state` (32–256 characters), a PKCE
   `code_verifier` (43–128 RFC 7636 unreserved characters), and its SHA-256
   base64url `code_challenge` (43 characters, no padding).
2. Open ASWebAuthenticationSession with
   `GET /native/login?state=...&code_challenge=...&code_challenge_method=S256`,
   callback scheme `stretto-native`. No arbitrary callback URLs are supported.
3. The browser offers Google Identity Services sign-in or explicit
   **Continue as email** for a logged-in web account. There is no automatic
   authorization. `POST /native/login/complete` is a browser-only form with
   session-bound `csrf` and either `credential` (Google ID token) or
   `use_session=true`; credentials must never be put in URLs.
4. Success returns HTTP 200 HTML with an **Open Stretto for Mac** link to
   `stretto-native://auth?code=...&state=...`. Click the link to finish.
   The explicit user gesture avoids Chrome blocking custom-scheme redirects
   after a form POST. There is no automatic redirect or refresh.
   Check the scheme, host and original state before accepting this callback.
5. In the native cookie jar, send JSON
   `POST /native/exchange {code, code_verifier, state}`.
   Success is `200 {success:true,email}` and a saved, regenerated
   `stretto-next` session cookie. Retain its `Set-Cookie` for the existing
   `/checklogin`, `/latestdata`, `/latestversion`, `/uploaddata`, etc.

Google uses the existing `GOOGLE_CLIENT_ID` (the `.apps.googleusercontent.com`
suffix is added if absent) and existing authorized web origin, verifies the
exact audience, verified email and browser nonce, and gets/creates the same
official account by email.

## Public configuration

`GET /native/config` returns exactly these public string fields (empty string
when unset): `{youtubeRedirectEndpoint, soundcloudClientId, spotifyClientId}`.
No client secrets, Google credentials or other environment variables are exposed.

## Spotify

Authenticate the native HTTP cookie jar with Stretto first.

1. Open ASWebAuthenticationSession with
   `GET /native/spotify/login?state=...&code_challenge=...&code_challenge_method=S256`
   using a **new** state/verifier. Even a fresh browser proceeds directly to
   Spotify without a Stretto cookie: Spotify credentials are independent, and
   PKCE proves the native requester's ownership of the handoff.
2. Spotify uses the existing client and registered redirect
   `https://next.kaiserapps.com/spotify_callback`, authorization-code flow,
   independent session-bound provider state and server-held provider PKCE.
   Scopes: `playlist-read-private playlist-read-collaborative user-library-read`.
   The callback is intercepted only when its state matches that browser's
   native Spotify flow; all other callbacks use the unchanged web handler.
3. The callback returns HTTP 200 HTML with an **Open Stretto for Mac** link to
   `stretto-native://spotify?code=...&state=...`. Click the link to finish.
   Only the opaque grant code is in the URL,
   never Spotify credentials. Validate the original state in the native app.
4. Send authenticated JSON
   `POST /native/spotify/exchange {code, code_verifier, state}`.
   Returns `200 {access_token,refresh_token,expires_in}`. This requires the
   native Stretto session cookie, but no browser Stretto session. It does not
   log in or replace either Stretto session.
5. Send authenticated JSON
   `POST /native/spotify/refresh {refresh_token}`.
   Returns `200 {access_token,expires_in,refresh_token?}`. Spotify may omit
   a rotated refresh token; keep the previous one in that case.

The server requires existing `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`;
no new registered redirect or secret in the native binary is needed.
Store native Spotify tokens in Keychain.

## Lifetimes and failures

Browser flows expire in 10 minutes; handoff codes expire in 90 seconds and are
single-use. MongoDB stores only hashed codes/state, with a TTL index and atomic
filtered `findOneAndDelete`; expiry is checked even before TTL cleanup. A wrong
state/verifier does not consume a valid code. Token payloads remain
server-side until exchange or TTL cleanup.

All native responses are `Cache-Control: no-store`. Only the native login HTML
uses `Referrer-Policy: strict-origin-when-cross-origin`, allowing GIS to validate
the authorized origin without leaking URL parameters to Google. Native APIs,
redirects, callbacks and errors retain `Referrer-Policy: no-referrer`.
Errors are sanitized JSON `{success:false,error}`:
`400 invalid_request|invalid_browser_flow|invalid_grant|spotify_authorization_denied`,
`401 login_required|invalid_credential`, `429 rate_limited`,
`502 spotify_token_failed`, or
`503 google_not_configured|spotify_not_configured|service_unavailable`.
Cancellation/provider failure does not return a success callback: the browser
shows the error (or the user cancels the session). Retry with a fresh login flow.

Basic per-IP, per-server-process limits per minute: 20 browser starts,
20 consent completions, 20 provider callbacks, 30 exchanges (shared by the two
exchange endpoints), and 10 Spotify refreshes. These are not a substitute for
edge abuse protection. Session and Mongo failures return an error, never
pretend success; an already-consumed grant cannot be reused after a save failure.

Validation: `node test/native-auth.test.js` (Node 16+, existing dependencies).
Tests inject an in-memory grant store and provider responses; no external
credentials or running MongoDB are required. Live Google/Spotify authorization
and MongoDB index creation still need deployment-environment verification.

For the Chrome form-submit regression, pass the native project's existing
Playwright module: `node test/native-auth.test.js ../stretto-native-macos/node_modules/playwright`.
This uses installed macOS Google Chrome with isolated test sessions and mocked
Google credentials, and suppresses app launching while checking the handoff click.
