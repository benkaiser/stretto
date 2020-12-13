import * as React from 'react';
import Spinner from 'react-spinkit';
import { Button, FormGroup, ToggleButton, ToggleButtonGroup, ListGroup, ListGroupItem, ProgressBar } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import SpotifyAPI from '../services/spotify_api';
import SpotifyImporter from '../services/spotify_importer';

export default class Spotify extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fetching: false
    };

    if (SpotifyAPI.instance.connected) {
      if (SpotifyImporter.instance.inProgress()) {
        this.state = {
          syncing: true
        };
      } else {
        this.state = {
          fetching: true
        };
        this._fetchData();
      }
    }
  }

  componentDidMount() {
    SpotifyImporter.instance.addEventListener('message', this._onEvent);
  }

  componentWillUnmount() {
    SpotifyImporter.instance.removeEventListener('message', this._onEvent);
  }

  render() {
    let currentView;
    if (this.state.syncing) {
      currentView = this.showSyncing();
    } else if (this.state.fetching) {
      currentView = this.showFetching();
    } else if (!this.state.playlists) {
      currentView = this.showConnect();
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
    if (SpotifyAPI.instance.connected) {
      this._fetchData();
      return <Spinner name='line-scale' />;
    }
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
        <h2>Playlists</h2>
        <p>
          <Button bsStyle='primary' onClick={this._sync}>Sync</Button>
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
      </div>
    );
  }

  showSyncing() {
    const state = SpotifyImporter.instance.getState();
    const inProgress = SpotifyImporter.instance.inProgress();
    let stateText = '';
    let progress = 0;
    if (state && Object.keys(state).length > 0) {
      const completed = Object.values(state).reduce((acc, item) => acc + (item.state ? 1 : 0), 0);
      const total = Object.values(state).length;
      if (total > 0) {
        progress = 100 * (completed / total);
      }
      stateText = completed === total ? '(Finished)' : `(${completed}/${total})`;
    }
    return (
      <div>
        <p>
          Feel free to browse around while your songs are synced. You can come back to this page to see progress. Closing your browser window will stop the sync.
        </p>
        <h2>Progress {stateText}</h2>
        { state && <ProgressBar now={progress} label={`${progress.toFixed(0)}%`} /> }
        { (state) ?
          <>
            { !inProgress && <Button bsStyle='primary' onClick={this._syncMore}>Sync More Playlists</Button>}
            <ListGroup>
              { Object.keys(state).map((songKey) => {
                const song = state[songKey];
                let songState = '';
                if (song.state === undefined) {
                  songState = <i className="fa fa-refresh" aria-hidden="true"></i>
                } else if (song.state === 'success') {
                  songState = <i className="fa fa-check" aria-hidden="true"></i>
                } else if (song.state === 'error') {
                  songState = <i title={song.error.message} className="fa fa-times" aria-hidden="true"></i>
                }
                return <ListGroupItem key={songKey}>{ songState } { song.artist } - { song.title }</ListGroupItem>;
              }) }
            </ListGroup>
            { !inProgress && <Button bsStyle='primary' onClick={this._syncMore}>Sync More Playlists</Button>}
          </>
          : <Spinner name='line-scale' />
        }
      </div>
    );
  }

  @autobind
  _syncMore() {
    this.setState({
      syncing: false,
      selectedPlaylists: []
    });
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
    SpotifyAPI.instance.startSync(this.state.playlists.filter((playlist) => this.state.selectedPlaylists.indexOf(playlist.id) >= 0))
    .then(() => {
      this.setState({
        syncing: true
      });
    });
  }

  @autobind
  _deselectAll() {
    this.setState({
      selectedPlaylists: []
    });
  }

  @autobind
  _onEvent(event) {
    this.forceUpdate();
  }
}
