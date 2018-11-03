import * as React from 'react';
import { Button, FormGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import SpotifyAPI from '../services/spotify_api';

export default class Spotify extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fetching: false
    };

    if (SpotifyAPI.instance.connected) {
      this.state = {
        fetching: true
      };
      this._fetchData();
    }
  }

  render() {
    let currentView;
    if (this.state.fetching) {
      currentView = this.showFetching();
    } else if (!this.state.playlists) {
      currentView = this.showConnect();
    } else if (this.state.syncing) {
      currentView = this.showSyncing();
    } else {
      currentView = this.showSync();
    }

    return (
      <div>
        <h1>Import from Spotify</h1>
        { currentView }
      </div>
    );
  }

  showConnect() {
    return (
      <Button bsStyle='primary' onClick={this._login}>Connect to Spotify</Button>
    );
  }

  showFetching() {
    return (
      <div>
        <p>Fetching your spotify library...</p>
        <i className='fa fa-circle-o-notch fa-spin fa-3x fa-fw'></i>
      </div>
    );
  }

  showSync() {
    return (
      <div>
        <p>
          Select which playlists you would like to sync<br/>
          <Button bsStyle='link' onClick={this._selectAll}>Check All</Button>
          <Button bsStyle='link' onClick={this._deselectAll}>Uncheck All</Button>
        </p>
        <FormGroup>
          <ToggleButtonGroup
            onChange={this._onChangePlaylist}
            type='checkbox'
            value={this.state.selectedPlaylists}
            vertical
          >
          { this.state.playlists.map((playlist) => {
            return <ToggleButton key={playlist.id} value={playlist.id}>{playlist.name} ({playlist.tracks.total} tracks)</ToggleButton>
          }) }
          </ToggleButtonGroup>
        </FormGroup>
        <Button bsStyle='primary' onClick={this._sync}>Sync</Button>
      </div>
    );
  }

  showSyncing() {
    return (
      <p>
        Your playlists are now syncing and will start to show up on the sidebar and the songs in your library. Closing the browser window will interrupt the sync.
      </p>
    );
  }

  @autobind
  _fetchData() {
    SpotifyAPI.instance.fetchData().then((data) => {
      this.setState({
        fetching: false,
        selectedPlaylists: [],
        playlists: data.playlists,
        albums: data.albums,
        artists: data.artists
      });
    });
  }

  @autobind
  _login() {
    SpotifyAPI.instance.login().then(() => {
      this.setState({
        fetching: true
      });
      this._fetchData();
    });
  }

  @autobind
  _onChangePlaylist(selectedPlaylists) {
    this.setState({ selectedPlaylists });
  }

  @autobind
  _selectAll() {
    this.setState({
      selectedPlaylists: this.state.playlists.map((playlist) => playlist.id)
    });
  }

  @autobind
  _sync() {
    SpotifyAPI.instance.startSync(this.state.playlists.filter((playlist) => this.state.selectedPlaylists.indexOf(playlist.id) >= 0));
    this.setState({
      syncing: true
    });
  }

  @autobind
  _deselectAll() {
    this.setState({
      selectedPlaylists: []
    });
  }
}
