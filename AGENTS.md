**IMPORTANT**: before you do anything else, run the `beans prime` command and heed its output.
**IMPORTANT**: Read files in their entirety, do not read portions of files unless the contents are longer than 2000 lines.

# AGENTS.md — Stretto Music Player

## Project Overview

**Stretto** is an open-source, web-based music player (v2.0.0, MIT license) that streams music from YouTube, SoundCloud, and Audius. It runs as a **Progressive Web App** with offline support, cloud sync, and multi-device remote control.

**Live:** `https://next.kaiserapps.com/`

## Architecture

Monolithic full-stack application — a single Node.js/Express server serves both a REST API and a server-rendered Pug shell, which boots a React 16 SPA. Not a monorepo, not microservices, not GraphQL.

| Layer | Technology |
|---|---|
| Backend | Express.js, Socket.IO, Mongoose |
| Frontend | React 16, React Router v4, SCSS, Bootstrap 3 (Bootswatch) |
| Database | MongoDB (per-user document blobs) |
| Real-time | Socket.IO (multi-device remote control) |
| PWA | Service Worker + Cache API + BroadcastChannel |
| Deployment | Docker + Dokku PaaS via GitHub Actions |

## Directory Structure

```
stretto/
├── index.js                   # Express server entry point
├── controllers/
│   ├── index.js               # All REST API routes (single Express Router)
│   └── socketio.js            # Socket.IO remote control handlers
├── models/
│   ├── data_mapper.js         # Facade wrapping all model operations
│   ├── user.js                # User model (email, hash, salt, version, googleObject)
│   ├── song.js                # Song model (stores ALL songs for a user as one blob)
│   ├── playlist.js            # Playlist model (stores ALL playlists as one blob)
│   ├── artist.js              # Followed artists model
│   └── shared_playlist.js     # Shared playlist model (keyed by UUID)
├── services/
│   ├── google.js              # Google OAuth2 token verification
│   └── itunes.js              # iTunes Search API (artist lookup, song feed, cover art)
├── src/
│   ├── js/
│   │   ├── index.js           # Frontend entry point (Loader class, initializes subsystems)
│   │   ├── serviceworker.js   # Service worker (offline caching, audio storage)
│   │   ├── models/            # Client-side data models (Song, Playlist, DataLayer)
│   │   ├── services/          # Player engine, streaming, auth, sync, integrations
│   │   └── views/             # React components (routes, layout, pages)
│   └── scss/
│       └── main.scss          # All styles (~850 lines)
├── views/                     # Pug server templates (layout, index, redirects)
├── static/
│   ├── assets/                # Icons, manifest.json, fonts (committed)
│   └── js/                    # Webpack output (gitignored)
├── bin/                       # Docker helper scripts (go, build, run, restart)
├── stubs/
│   └── jquery.js              # jQuery stub (returns null, avoids bootstrap-slider dep)
├── webpack.config.js          # Two entry points: main + serviceworker
├── docker-compose.yml         # MongoDB + web services
├── Dockerfile.local           # Node 16 dev container
├── .env.example               # Required env vars template
├── .github/workflows/deploy.yml  # CI/CD → Dokku
└── package.json               # Dependencies and scripts
```

## Backend

### Server Entry (`index.js`)

- Loads `.env` via `dotenv`
- Creates Express + HTTP server + Socket.IO
- Middleware: `body-parser`, `cookie-parser`, `express-session` (MongoDB-backed via `connect-mongodb-session`)
- Proxies `/scapi` → `https://api-v2.soundcloud.com` (SoundCloud API proxy)
- Pug view engine, serves static files from `/static`
- Routes from `controllers/index.js`, Socket.IO from `controllers/socketio.js`

### Key API Routes (`controllers/index.js`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/googleLogin` | POST | No | Google OAuth login + session |
| `/login` | POST | No | Email/password login |
| `/createaccount` | POST | No | Account registration |
| `/checklogin` | POST | No | Check session status |
| `/logout` | POST | No | Destroy session |
| `/forgotpassword` | POST | No | Send password reset email (Zoho SMTP) |
| `/completereset` | POST | No | Complete password reset with token |
| `/latestversion` | GET | Yes | User's data version number |
| `/latestdata` | GET | Yes | Full user library (songs + playlists) |
| `/uploaddata` | POST | Yes | Sync library data (optimistic concurrency) |
| `/addsong` | POST | Yes | Add a single song to a playlist |
| `/suggest/artists` | GET | Yes | Artist suggestions via iTunes |
| `/artists/followed` | GET | Yes | Followed artists + songs |
| `/artists/follow` | POST | Yes | Follow an artist |
| `/artists/unfollow` | POST | Yes | Unfollow an artist |
| `/share` | POST | Yes | Share playlist (UUID link) |
| `/shared/:guid` | GET | No | View shared playlist |
| `/spotify_callback` | GET | No | Spotify OAuth callback |
| `*` | GET | No | Catch-all → serves React SPA |

**Authentication:** Session-based via `req.session.loggedIn`. A simple `loggedIn` middleware function guards protected routes.

### Socket.IO (`controllers/socketio.js`)

Enables remote control across devices. Devices join rooms by user email and can emit `playpause`, `previous`, `next` to control playback on all connected devices.

### Database Models (`models/`)

All models use Mongoose. The `DataMapper` class (`data_mapper.js`) is a static facade that wraps all model CRUD.

**Critical design note:** Songs and playlists are stored as **entire blobs per user** (one document per user, not per song). Every sync operation uploads/downloads the entire library. A `version` timestamp on the User model provides optimistic concurrency control.

| Model | Key Fields |
|---|---|
| User | `email`, `hash`, `salt`, `resetToken`, `publicJsonLibrary`, `version`, `googleObject` |
| Song | `email`, `songBlob` (Mixed — all songs as one blob) |
| Playlist | `email`, `playlistBlob` (Mixed — all playlists as one blob) |
| Artist | `email`, `artists` (Mixed array) |
| SharedPlaylist | `guid`, `email`, `playlistBlob` |

Password hashing uses PBKDF2 with SHA-512 (10,000 iterations, 512-byte key).

## Frontend

### Initialization (`src/js/index.js`)

The `Loader` class initializes subsystems in order:
1. `TitleUpdater` → updates browser tab title with current song
2. `FirstRunExperience` → onboarding flow
3. `AccountManager` → auth state
4. `Keyboard` → keyboard shortcuts (Space = play/pause, arrows = next/prev)
5. `Theme` → loads Bootswatch theme from CDN
6. `ModelInitialiser` → loads songs/playlists from localStorage
7. `RootView` → mounts React Router into `#react` div
8. `Lyrics` → auto-fetches lyrics via AZLyrics
9. `ServiceWorkerClient` → registers service worker
10. `SoundcloudOAuth` → SoundCloud auth initialization

### Routing (`src/js/views/root.jsx`)

React Router v4 (`BrowserRouter` + `Switch`):

| Path | Component | Description |
|---|---|---|
| `/` | `Intro` | Welcome/landing page |
| `/home` | `Home` | Playlist tiles grid |
| `/playlist/:playlist` | `Playlist` | Song list view |
| `/player` | `PlayerView` | Full-screen mobile player |
| `/add` | `Add` | Add songs by URL |
| `/edit/:id` | `Edit` | Edit song metadata |
| `/search/:search` | `Search` | Search library |
| `/spotify` | `Spotify` | Spotify import |
| `/discover` | `Discover` | Top charts (iTunes/Spotify) |
| `/artists/feed` | `ArtistsFeed` | Followed artists' new music |
| `/artists/add` | `ArtistSuggestions` | Discover & follow artists |
| `/artists/manage` | `ArtistsManage` | Manage followed artists |
| `/soundcloud` | `Soundcloud` | SoundCloud integration |
| `/sync` | `Sync` | Cloud sync page |
| `/backup` | `BackupRestore` | Backup/restore library |
| `/settings` | `Settings` | App settings |
| `/shared/:guid` | `SharedPlaylist` | View shared playlist |
| `/mix/:playlist` | `YoutubeMix` | YouTube radio mix |
| `/remote` | `Remote` | Remote control (uses separate layout) |
| `/explicitscan` | `ExplicitScan` | Scan for explicit tracks |

### Layout (`src/js/views/layout.jsx`)

Responsive with a 700px breakpoint:
- **Desktop:** Fixed left `Sidebar` (logo, search, navigation, player controls, album art) + content area
- **Mobile:** `MobileHeader` (top navbar) + `MobileFooter` (bottom player controls) + content area
- Global overlays: `Bootbox` (modals), `AlerterContainer` (toasts), `ContextMenu` (right-click menus)

### State Management

**No Redux or MobX.** Uses a custom observer pattern:
- `Song` and `Playlist` are static classes holding in-memory arrays
- They expose `addOnChangeListener(callback)` and `change()` (notify) methods
- Components subscribe in constructors and call `setState({})` to re-render on changes
- **Persistence:** `DataLayer` wraps `localStorage`; `SyncManager` syncs to server

### Player Architecture (Strategy Pattern)

The `Player` singleton (`src/js/services/player.js`) orchestrates playback, delegating to stream-specific implementations:

```
Player (orchestrator)
  ├── HTML5AudioPlayer            → offline cached files
  ├── YoutubeStreamPlayer         → YouTube via redirect endpoint (library songs)
  ├── YoutubeIframePlayer         → YouTube IFrame API (preview/non-library)
  ├── SoundcloudStreamPlayer      → SoundCloud HLS streams
  └── AudiusStreamPlayer          → Audius API streams
```

All extend `AbstractHTML5AudioPlayer` which provides a common interface: `dispose()`, `toggle()`, `setVolume()`, `getPosition()`, `setCurrentTime()`.

Song IDs are prefixed by source: `y_` (YouTube), `s_` (SoundCloud), `a_` (Audius).

### Key Frontend Services (`src/js/services/`)

| Service | File | Purpose |
|---|---|---|
| Player | `player.js` | Singleton — playback orchestration, queue, shuffle, repeat, MediaSession API |
| YouTube | `youtube.js` | Search (scrapes results page), video info extraction, playlist parsing |
| SoundCloud | `soundcloud.js` | Search & track resolution |
| Audius | `audius.js` | Resolve & stream via Audius API |
| AccountManager | `account_manager.js` | Singleton — auth state, Google OAuth + email/password login |
| SyncManager | `sync_manager.jsx` | Singleton — bidirectional sync with version-based conflict resolution |
| SpotifyAPI | `spotify_api.js` | Spotify Web API — OAuth, playlists, albums, charts |
| SpotifyImporter | `spotify_importer.js` | Imports Spotify playlists by finding YouTube matches |
| SocketManager | `socket_manager.js` | Singleton — Socket.IO client for remote control |
| Lyrics | `lyrics.jsx` | Auto-fetches lyrics from AZLyrics on song change |
| ServiceWorkerClient | `service_worker_client.jsx` | Communicates with SW via BroadcastChannel for offline audio |
| Alerter | `alerter.jsx` | Toast notification system (`react-alert`) |
| Bootbox | `bootbox.jsx` | Modal dialog system (alert, confirm, prompt) |

### Service Worker (`src/js/serviceworker.js`)

Offline-first PWA strategy:
- **App shell caching:** `/`, `/static/js/main.js`, Google API, Font Awesome
- **Navigation preload:** Returns cached shell for all SPA routes, background-refetches
- **Third-party caching:** Bootswatch themes, YouTube thumbnails, album art from various CDNs
- **Audio offline storage:** Separate `stretto-cache-audio` cache for downloaded songs
- **BroadcastChannel API:** Receives `DOWNLOAD`, `OFFLINE_RAW_FILE`, `REMOVE_OFFLINE`, `EMIT_OFFLINED` messages

### Styling

- **SCSS** — single file `src/scss/main.scss`
- **Bootstrap 3** via Bootswatch CDN themes (15 themes, switchable at runtime in Settings)
- **react-bootstrap v0.32** for UI components
- **Font Awesome 4.7** for icons
- **Custom font:** WisdomScript (logo)
- **Responsive:** 700px breakpoint for mobile vs desktop layout

## Build & Dev

### NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `nodemon & webpack --watch` | Development (auto-restart server + hot rebuild) |
| `start` | `webpack && node --harmony index.js` | Production |
| `webpack` | `webpack` | Build only |

### Webpack (`webpack.config.js`)

- **Two entry points:** `main` → `src/js/index.js`, `serviceworker` → `src/js/serviceworker.js`
- **Output:** `static/js/[name].js`
- **Babel:** `@babel/preset-env` (last 2 Chrome versions), decorators (legacy), JSX, object rest spread
- **Loaders:** `babel-loader`, `style-loader` + `css-loader`, `sass-loader`
- **jQuery:** Aliased to `stubs/jquery.js` (returns `null`) to avoid pulling in full jQuery

### Docker

```bash
bin/go          # docker-compose up -d
bin/build       # docker-compose build
bin/run <cmd>   # docker-compose run --rm web /bin/bash -c "<cmd>"
bin/restart     # stop → build → start
bin/softrestart # stop → start (no rebuild)
```

`docker-compose.yml` defines two services: `mongo` (MongoDB) and `web` (Node.js app on port 3000).

### Environment Variables (`.env`)

Required variables (see `.env.example`):
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `SPOTIFY_CLIENT_ID` — Spotify API client ID
- `SOUNDCLOUD_CLIENT_ID` — SoundCloud API client ID
- `SMTP_PASSWORD` — Zoho SMTP password for password reset emails
- `YOUTUBE_REDIRECT_ENDPOINT` — YouTube stream redirect URL
- `SOUNDCLOUD_REDIRECT_ENDPOINT` — SoundCloud stream redirect URL

### CI/CD (`.github/workflows/deploy.yml`)

- **Trigger:** Push to `master`
- **Action:** Deploys to Dokku PaaS at `ssh://dokku@kaiserapps.com/stretto-next`

## External Integrations

| Integration | Purpose | Auth Method |
|---|---|---|
| Google OAuth | User authentication | OAuth2 ID token (server-side verification) |
| YouTube | Music search & streaming | Scraping (no API key) + redirect endpoint |
| SoundCloud | Music search & streaming | Client ID + HLS |
| Audius | Decentralized music streaming | Public API (no auth) |
| Spotify | Playlist import, chart data | OAuth2 implicit flow (client-side) |
| iTunes | Charts, artist discovery | Public Search API |
| AZLyrics | Lyrics fetching | Scraping via `js-azlyrics` |
| MusicBrainz | Cover art lookup | Public API |
| Zoho SMTP | Password reset emails | SMTP credentials |

## Testing

**There are no tests.** No test framework, test files, or test scripts exist in the project.

## Key Patterns & Conventions

1. **Singletons:** `Player`, `AccountManager`, `SocketManager`, `SyncManager` are all instantiated at module level and exported as instances (`export default new ClassName()`)
2. **Observer pattern:** Models use `addOnChangeListener`/`change()` for reactive updates instead of Redux
3. **Per-user blobs:** Database stores entire song/playlist collections as single documents per user — not normalized
4. **Source-prefixed IDs:** Song IDs use `y_`, `s_`, `a_` prefixes to identify their streaming source
5. **JSX in services:** Some service files use `.jsx` extension and contain React elements (e.g., `alerter.jsx`, `sync_manager.jsx`)
6. **No TypeScript:** Entire codebase is plain JavaScript with JSX
7. **Class components:** All React components are class-based (no hooks)
8. **Global imports:** Services and models are imported directly and used as global singletons throughout the codebase
