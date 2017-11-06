import { h, Component } from 'preact';
import { Button } from 'react-bootstrap';
import SpotifyWebAPI from 'spotify-web-api-js';
import autobind from 'autobind-decorator';
import Utilities from '../utilities';

const SpotifyAPI = new SpotifyWebAPI();

export default class Spotify extends Component {
  render() {
    return (
      <div>
        <h1>Spotify</h1>
        { this._access_token ? this.showList() : this.showConnect() }
      </div>
    );
  }

  showConnect() {
    return (
      <Button bsStyle='primary' onClick={this._login}>Connect to Spotify</Button>
    );
  }

  showList() {
    return (
      <p>What would you like to sync?</p>
    );
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

  _setupAPI() {
    SpotifyAPI.setAccessToken(this._access_token);
  }

  _generateAndStoreState() {
    this._state = Utilities.generateRandomString(16);
    return this._state;
  }

  @autobind
  _login() {
    window.SpotifyCallback = this._spotifyCallback;
    this._window = window.open(this._authUrl(), 'Spotify Auth', 'height=650,width=500')
  }

  @autobind
  _spotifyCallback(hash) {
    this._window && this._window.close();
    const hashParams = Utilities.getHashParams(hash);
    console.log(hashParams);
    if (hashParams.access_token && this._state === hashParams.state) {
      this._access_token = hashParams.access_token;
    }
    this._setupAPI();
  }
}
