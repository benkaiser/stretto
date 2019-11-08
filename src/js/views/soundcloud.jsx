import * as React from 'react';
import { Alert, Button, FormControl } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import Playlist from '../models/playlist';
import Song from '../models/song';
import PlaylistView from './playlist';
import autobind from 'autobind-decorator';
import { default as SoundcloudService } from '../services/soundcloud';

export default class Soundcloud extends PlaylistView {
  constructor(props) {
    super(props);
    const soundcloudToken = localStorage.getItem('soundcloud_token');
    this.state = {
      ...this.state,
      token: soundcloudToken,
      loading: !!soundcloudToken
    };
    this._tokenInput = React.createRef();
    this.state.token && this._getSoundcloudStream(this.state.token);
  }

  render() {
    if (this.state.loading) {
      return <Spinner />;
    } else if (this.state.error || !this.state.token || !this._soundcloudPlayList) {
      return (
        <div className='intro'>
          { this.state.error &&
            <Alert bsStyle='danger'>
              <strong>Oh snap!</strong> {this.state.error.toString()}
            </Alert>
          }
          <p>We need your soundcloud token to load your stream</p>
          <p>
            <FormControl
              type='text'
              placeholder='Token'
              inputRef={this._tokenInput} />
          </p>
          <Button onClick={this._onTokenSubmit}>Load Stream</Button>
        </div>
      );
    } else {
      return super.render();
    }
  }

  getPlaylistFromProps() {
    return this._soundcloudPlayList || new Playlist({
      title: 'Soundcloud Stream',
      songs: []
    });
  }

  headerButtons() {
    return (
      <div>
      </div>
    );
  }

  @autobind
  _onTokenSubmit() {
    this.setState({
      token: this._tokenInput.current.value
    });
    this._getSoundcloudStream(this._tokenInput.current.value);
  }

  @autobind
  _getSoundcloudStream(token) {
    this.setState({
      loading: true
    });
    if (!token) {
      return;
    }
    fetch(`/scapi/stream?promoted_playlist=true&client_id=${SoundcloudService.client_id}&limit=30&offset=0&linked_partitioning=1`,
    {
      "credentials":"include",
      "headers":{
        "accept":"application/json, text/javascript, */*; q=0.01",
        "authorization": token
      },
      "referrer":"https://soundcloud.com/",
      "method":"GET",
    })
    .then(response => response.json())
    .then(json => {
      localStorage.setItem('soundcloud_token', token);
      const songs = this._processTracks(json.collection, []);
      this._soundcloudPlayList = new Playlist({
        title: 'Soundcloud Stream',
        rawSongs: songs,
        editable: false
      });
      const state = this.determineStateForElementsToShow(0, window.innerHeight, this._soundcloudPlayList);
      this.setState({
        ...state,
        playlist: this._soundcloudPlayList,
        next_href: json.next_href,
        token: token,
        loading: false
      });
    }).catch(error => {
      this.setState({
        loading: false,
        token: '',
        error: error
      });
    });
  }

  allowPagination() {
    return this.state.next_href;
  }

  paginationCallback() {
    fetch(this.state.next_href.replace('https://api-v2.soundcloud.com', '/scapi'),
    {
      "credentials":"include",
      "headers":{
        "accept":"application/json, text/javascript, */*; q=0.01",
        "authorization": this.state.token
      },
      "referrer":"https://soundcloud.com/",
      "method":"GET",
    }).then(response => response.json())
    .then(json => {
      const songs = this._processTracks(json.collection, this._soundcloudPlayList._rawSongs);
      this._soundcloudPlayList.rawSongs = songs;
      const state = this.determineStateForElementsToShow(0, window.innerHeight, this._soundcloudPlayList);
      this.setState({
        ...state,
        playlist: this._soundcloudPlayList,
        next_href: json.next_href,
        loading: false
      });
    }).catch(error => {
      console.log(error);
      this.setState({
        next_href: ''
      });
    });
  }

  getColumns() {
    return ['title', 'artist', 'duration'];
  }

  columnTitleMappings() {
    return {
      'title': 'Title',
      'artist': 'Artist',
      'duration': 'Duration'
    };
  }

  columnWidthMappings() {
    return {
      'title': 0.5,
      'artist': 0.3,
      'duration': 0.2
    };
  }

  _processTracks(collection, existingSongs) {
    collection = collection.filter(item => !!item.track).map(item => new Song({
      title: item.track.title,
      artist: item.user.username,
      cover: item.track.artwork_url,
      url: item.track.permalink_url,
      isSoundcloud: true,
      duration: item.track.duration / 1000,
      id: 's_' + item.track.id
    }));
    collection = existingSongs.concat(collection);
    // de-dup
    collection = collection.filter((track, index) =>
      collection.findIndex(foundTrack => foundTrack.id === track.id) === index
    );
    return collection;
  }
}
