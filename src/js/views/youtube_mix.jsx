import * as React from 'react';
import Spinner from 'react-spinkit';
import { Alert, DropdownButton, MenuItem } from 'react-bootstrap';
import Alerter from '../services/alerter';
import Youtube from '../services/youtube';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';

export default class YoutubeMix extends PlaylistView {
  constructor(props) {
    super(props);
    this._getYoutubePlaylist();
  }

  getColumns() {
    return ['title', 'channel', 'views', 'duration'];
  }

  columnTitleMappings() {
    return {
      title: 'Title',
      channel: 'Channel',
      views: 'Views',
      duration: 'Length'
    };
  }

  columnWidthMappings() {
    return {
      title: 0.45,
      channel: 0.25,
      views: 0.15,
      duration: 0.15
    };
  }

  _goToChannel(channelUrl, event) {
    this.props.history.push(`/channel/${encodeURIComponent(channelUrl)}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  itemForColumn(column, song) {
    if (column === 'views') {
      return <td key='views'>{song.viewsLabel || ''}</td>;
    }
    if (column === 'channel') {
      if (song.channelUrl) {
        return (
          <td key='channel' role='link' className='searchable' onClick={this._goToChannel.bind(this, song.channelUrl)}>
            {song.channel}
          </td>
        );
      }
      return <td key='channel'>{song.channel || ''}</td>;
    }
    return super.itemForColumn(column, song);
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
    } else if (!this._youtubePlaylist) {
      return (
        <div className='intro'>
          { this.header() }
          <p>Loading songs...</p>
          <Spinner />
        </div>
      );
    } else {
      return super.render();
    }
  }

  componentWillReceiveProps(props) {
    this._youtubePlaylist = undefined;
    this.setState(this.getStateFromprops(props));
    this._getYoutubePlaylist();
  }


  getPlaylistFromProps() {
    return this._youtubePlaylist || new Playlist({
      title: 'Youtube Playlist: Loading...',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div>
        <DropdownButton id='playlist-dropdown' title='Options'>
          <MenuItem onClick={this.addToLibrary}>Add all Songs to Library</MenuItem>
          <MenuItem onClick={this.toStrettoPlaylist}>Create Stretto Playlist</MenuItem>
        </DropdownButton>
      </div>
    );
  }

  @autobind
  addToLibrary() {
    const nonDupedSongs = this._youtubePlaylist._rawSongs.filter(newSong => !Song.findById(newSong.id));
    const library = Playlist.getByTitle(Playlist.LIBRARY);
    nonDupedSongs.forEach(song => {
      const newSong = Song.create(song)
      library.addSong(newSong);
    });
  }

  @autobind
  toStrettoPlaylist() {
    this.addToLibrary();
    Playlist.create({
      title: this._youtubePlaylist.title,
      songs: this._youtubePlaylist._rawSongs.map(song => song.id)
    });
    Alerter.success(`Created playlist named ${this._youtubePlaylist.title}`);
  }

  @autobind
  _getYoutubePlaylist() {
    const param = this.props.match.params.playlist;
    let videoId, playlistId;
    if (param.indexOf('+') !== -1) {
      [videoId, playlistId] = param.split('+');
    } else {
      videoId = param;
      playlistId = 'RD' + videoId;
    }
    Youtube.getPlaylistAnonymous(videoId, playlistId)
    .then(mixPlaylist => {
      const songs = mixPlaylist.items.map(item => new Song(item));
      const byId = {};
      mixPlaylist.items.forEach(item => { byId[item.id] = item; });
      songs.forEach(song => {
        const item = byId[song.originalId];
        if (item) {
          song.views = item.views || 0;
          song.viewsLabel = item.viewsLabel || '';
          song.channel = item.channel || '';
          song.channelUrl = item.channelUrl || '';
        }
      });
      this._youtubePlaylist = new Playlist({
        title: 'Youtube Playlist: ' + mixPlaylist.title,
        rawSongs: songs
      });
      const state = this.determineStateForElementsToShow(0, window.innerHeight, this._youtubePlaylist);
      this.setState({
        ...state,
        playlist: this._youtubePlaylist
      });
    }).catch((error) => {
      console.log(error);
      this.setState({
        error: 'Unable to fetch playlist. Maybe the video is no longer available?'
      });
    })
  }
}
