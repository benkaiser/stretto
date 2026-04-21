import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert, Button, ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';
import Alerter from '../services/alerter';
import Youtube from '../services/youtube';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

export default class YoutubeChannel extends PlaylistView {
  constructor(props) {
    super(props);
    this._channelPlaylist = null;
    this._continuation = null;
    this._apiKey = null;
    this._clientVersion = null;
    this._loadingMore = false;
    this._chips = [];
    this._selectedChip = 'Latest';
    this._channelId = null;
    this._fetchChannel();
  }

  render() {
    if (this.state.error) {
      return (
        <div className='intro'>
          { this.header() }
          <Alert bsStyle='danger'>
            <strong>Oh snap!</strong> {this.state.error}
          </Alert>
        </div>
      );
    } else if (!this._channelPlaylist) {
      return (
        <div className='intro'>
          { this.header() }
          <p>Loading videos...</p>
          <Spinner />
        </div>
      );
    }
    return super.render();
  }

  componentWillReceiveProps(props) {
    this._channelPlaylist = null;
    this._continuation = null;
    this.setState(this.getStateFromprops(props));
    this._fetchChannel(props);
  }

  getPlaylistFromProps() {
    return this._channelPlaylist || new Playlist({
      title: 'YouTube Channel: Loading...',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div>
        { this._chips.length > 0 && (
          <ButtonGroup style={{ marginRight: '8px' }}>
            { this._chips.map(chip => (
              <Button
                key={chip.label}
                bsStyle={this._selectedChip === chip.label ? 'primary' : 'default'}
                disabled={this._loadingMore}
                onClick={() => this.selectChip(chip)}
              >
                {chip.label}
              </Button>
            )) }
          </ButtonGroup>
        ) }
        <DropdownButton id='playlist-dropdown' title='Options'>
          <MenuItem onClick={this.addToLibrary}>Add all Songs to Library</MenuItem>
          <MenuItem onClick={this.toStrettoPlaylist}>Create Stretto Playlist</MenuItem>
        </DropdownButton>
      </div>
    );
  }

  getColumns() {
    return ['title', 'views', 'duration'];
  }

  columnTitleMappings() {
    return {
      title: 'Title',
      views: 'Views',
      duration: 'Length'
    };
  }

  columnWidthMappings() {
    return {
      title: 0.6,
      views: 0.2,
      duration: 0.2
    };
  }

  itemForColumn(column, song) {
    if (column === 'views') {
      return <td key='views'>{song.viewsLabel || ''}</td>;
    }
    return super.itemForColumn(column, song);
  }

  _attachViews(songs, items) {
    const byId = {};
    items.forEach(item => { byId[item.id] = item; });
    songs.forEach(song => {
      const item = byId[song.originalId];
      if (item) {
        song.views = item.views || 0;
        song.viewsLabel = item.viewsLabel || '';
      }
    });
  }

  @autobind
  selectChip(chip) {
    if (this._loadingMore || this._selectedChip === chip.label) return;
    this._loadingMore = true;
    this._selectedChip = chip.label;
    this.forceUpdate();
    Youtube.getChannelVideosByChip(chip.token, this._apiKey, this._clientVersion)
      .then(({ items, continuation }) => {
        this._continuation = continuation;
        const songs = items.map(item => new Song(item));
        this._attachViews(songs, items);
        this._channelPlaylist.rawSongs = songs;
        const state = this.determineStateForElementsToShow(0, this.contentContainer().clientHeight, this._channelPlaylist);
        this.contentContainer().scrollTop = 0;
        this._loadingMore = false;
        this.setState({ ...state, playlist: this._channelPlaylist });
      })
      .catch((error) => {
        console.log(error);
        this._loadingMore = false;
        Alerter.error('Unable to re-sort videos');
        this.forceUpdate();
      });
  }

  allowPagination() {
    return !!this._continuation;
  }

  @autobind
  paginationCallback() {
    if (!this._continuation || this._loadingMore) return;
    this._loadingMore = true;
    Youtube.getChannelVideosContinuation(this._continuation, this._apiKey, this._clientVersion)
      .then(({ items, continuation }) => {
        this._continuation = continuation;
        const newSongs = items.map(item => new Song(item));
        this._attachViews(newSongs, items);
        this._channelPlaylist.rawSongs = this._channelPlaylist._rawSongs.concat(newSongs);
        const state = this.determineStateForElementsToShow(this.contentContainer().scrollTop, this.contentContainer().clientHeight, this._channelPlaylist);
        this._loadingMore = false;
        this.setState({ ...state, playlist: this._channelPlaylist });
      })
      .catch((error) => {
        console.log(error);
        this._loadingMore = false;
        Alerter.error('Unable to load more videos');
      });
  }

  @autobind
  addToLibrary() {
    const nonDupedSongs = this._channelPlaylist._rawSongs.filter(newSong => !Song.findById(newSong.id));
    const library = Playlist.getByTitle(Playlist.LIBRARY);
    nonDupedSongs.forEach(song => {
      const newSong = Song.create(song);
      library.addSong(newSong);
    });
    Alerter.success(`Added ${nonDupedSongs.length} songs to Library`);
  }

  @autobind
  toStrettoPlaylist() {
    this.addToLibrary();
    Playlist.create({
      title: this._channelPlaylist.title,
      songs: this._channelPlaylist._rawSongs.map(song => song.id)
    });
    Alerter.success(`Created playlist named ${this._channelPlaylist.title}`);
  }

  _fetchChannel(props = this.props) {
    const channelUrl = decodeURIComponent(props.match.params.channelUrl);
    Youtube.getChannelVideos(channelUrl)
      .then(result => {
        this._continuation = result.continuation;
        this._apiKey = result.apiKey;
        this._clientVersion = result.clientVersion;
        this._chips = result.chips || [];
        this._channelId = result.channelId;
        const selected = this._chips.find(c => c.selected);
        this._selectedChip = selected ? selected.label : (this._chips[0] && this._chips[0].label) || null;
        const songs = result.items.map(item => new Song(item));
        this._attachViews(songs, result.items);
        this._channelPlaylist = new Playlist({
          title: 'YouTube Channel: ' + result.title,
          rawSongs: songs
        });
        const state = this.determineStateForElementsToShow(0, window.innerHeight, this._channelPlaylist);
        this.setState({ ...state, playlist: this._channelPlaylist });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          error: 'Unable to fetch channel videos.'
        });
      });
  }
}
