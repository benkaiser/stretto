import SpotifyWebAPI from 'spotify-web-api-js';
import async from 'async';
import autobind from 'autobind-decorator';

import Song from '../models/song';
import SpotifyImporter from './spotify_importer';
import Utilities from '../utilities';


const SpotifyExternalAPI = new SpotifyWebAPI();

const chartMap = {
  'top': '37i9dQZEVXbMDoHDwVN2tF',
  'viral': '37i9dQZEVXbLiRSasKsNU9'
};
const SPOTIFY_DEFAULT_COVER = 'https://developer.spotify.com/assets/branding-guidelines/icon1@2x.png';

export default class SpotifyAPI {
  static get instance() {
    return SpotifyAPI.__instance || (SpotifyAPI.__instance = new SpotifyAPI());
  }

  static fetchChart(type) {
    type = chartMap[type];
    return SpotifyExternalAPI.getPlaylist('spotifycharts', type)
    .then(function(data) {
      return data.tracks.items.map((item) => {
        return new Song({
          cover: item.track.album.images[0].url,
          title: item.track.name,
          artist: item.track.artists.map(artist => artist.name).join(', '),
          album: item.track.album.name,
          spotifyId: item.track.id,
          explicit: item.track.explicit,
          deferred: true
        });
      });
    }, function(err) {
      console.log(err);
      return undefined;
    });
  }

  get connected() {
    return !!this._access_token;
  }

  login() {
    window.SpotifyCallback = this._spotifyCallback;
    this._window = window.open(this._authUrl(), 'Spotify Auth', 'height=650,width=500');
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  fetchData() {
    return Promise.all([
      this._getAll(SpotifyExternalAPI.getUserPlaylists),
      this._getAll(SpotifyExternalAPI.getMySavedAlbums),
      this._getAll(SpotifyExternalAPI.getFollowedArtists, 'artists')
    ]).then((data) => {
      return {
        playlists: data[0],
        albums: data[1],
        artists: data[2]
      };
    });
  }

  startSync(playlists) {
    return new Promise((resolve) => {
      async.eachSeries(playlists, (playlist, done) => {
        let link = playlist.tracks.href;
        playlist.tracks.items = [];
        async.until(() => !link, (next) => {
          fetch(link, {
            headers: {
              'Authorization': `Bearer ${this._access_token}`,
            }
          })
          .then(Utilities.fetchToJson)
          .then((response) => {
            playlist.tracks.items = playlist.tracks.items.concat(response.items);
            link = response.next;
            next();
          });
        }, done);
      }, () => {
        this._startImportingPlaylists(playlists);
        resolve();
      });
    });
  }

  _authUrl() {
    const state = this._generateAndStoreState();
    const scopes_needed = 'playlist-read-private playlist-read-collaborative user-follow-read user-library-read user-top-read';
    return 'https://accounts.spotify.com/authorize' +
      `?response_type=token` +
      `&client_id=${encodeURIComponent(env.SPOTIFY_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + '/spotify_callback')}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scopes_needed)}`;
  }

  _getAll(spotifyFunc, accessor) {
    let finished = false;
    let playlists = [];
    let options = {};
    return new Promise((resolve) => {
      async.until(() => finished, (next) => {
        spotifyFunc(options).then((data) => {
          if (accessor && data[accessor]) {
            data = data[accessor];
          }
          finished = !data.next;
          options.offset = data.offset + data.limit;
          playlists = playlists.concat(data.items);
          next();
        });
      }, () => {
        resolve(playlists);
      });
    });
  }

  _generateAndStoreState() {
    this._state = Utilities.generateRandomString(16);
    return this._state;
  }

  @autobind
  _spotifyCallback(hash) {
    this._window && this._window.close();
    const hashParams = Utilities.getHashParams(hash);
    if (hashParams.access_token && this._state === hashParams.state) {
      this._access_token = hashParams.access_token;
      SpotifyExternalAPI.setAccessToken(this._access_token);
      this._resolve();
    }
  }

  _startImportingPlaylists(playlists) {
    const songs = {};
    playlists.map((playlist) => {
      playlist.tracks.items.map((item) => {
        if (songs[item.track.uri]) {
          songs[item.track.uri].playlists.push(playlist.name);
        } else {
          songs[item.track.uri] = {
            album: item.track.album.name,
            artist: item.track.artists.map((artist) => artist.name).join(' + '),
            cover: item.track.album.images[0] && item.track.album.images[0].url,
            disc: item.track.disc_number,
            duration: item.track.duration_ms / 1000,
            explicit: item.track.explicit || false,
            track: item.track.track_number,
            title: item.track.name,
            playlists: [playlist.name]
          };
        }
      });
    });
    SpotifyImporter.instance.start(songs);
  }
}
