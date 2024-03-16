import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Spinner from 'react-spinkit';
import Alerter from '../services/alerter';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from '../services/soundcloud';
import Youtube from '../services/youtube';
import Audius from '../services/audius';
import autobind from 'autobind-decorator';

export default class Add extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    this.input && this.input.focus && this.input.focus();
  }

  render() {
    return (
      <div className='add'>
        <h1>Add a Song from YouTube, SoundCloud or Audius</h1>
        <form>
          <div className='form-group'>
            <label htmlFor='songurl'>Song URL</label>
            <input className='form-control'
                   onKeyUp={this.onChange}
                   placeholder='https://youtube.com/... or https://soundcloud.com/... or https://audius.co/...'
                   ref={(input) => { this.input = input; }}
                   type='text'
                   name='songurl'
            />
          </div>
        </form>
        <div className='addLoading'>
        { this.state.loading &&
          <div><Spinner name='line-scale' /></div>
        }
        { this.state.error &&
          <Alert bsStyle='danger'>
            <strong>Oh no!</strong> Looks like we are {this.state.error}
          </Alert>
        }
        </div>
        { this.state.playlistUrl && (
          <div>
            <Link className='btn btn-primary' to={this.state.playlistUrl}>View All Songs in Playlist</Link>
          </div>
        )}
        { this.state.track &&
        <div className='row'>
          <div className='col-lg-6'>
            <h3>Track Information</h3>
            <form>
              <div className='form-group'>
                <label htmlFor='title'>Title</label>
                <input className='form-control'
                       name='title'
                       onKeyUp={this.attributeModified}
                       ref={(input) => { this.title = input; }}
                       type='text'
                       defaultValue={this.getTitle()}
                />
              </div>
              <div className='form-group'>
                <label htmlFor='artist'>Artist</label>
                <input className='form-control'
                       name='artist'
                       onKeyUp={this.attributeModified}
                       ref={(input) => { this.artist = input; }}
                       type='text'
                       defaultValue={this.getArtist()}
                />
              </div>
              <div className='form-group'>
                <label htmlFor='album'>Album</label>
                <input className='form-control'
                       name='album'
                       onKeyUp={this.attributeModified}
                       ref={(input) => { this.album = input; }}
                       type='text'
                       defaultValue={this.getAlbum()}
                />
              </div>
              <div className='form-group'>
                <label>
                <input className='explicitCheckbox'
                  name='explicit'
                  ref={(input) => { this.explicit = input; }}
                  type='checkbox'
                  defaultValue={false}
                />
                  Explicit
                </label>
              </div>
              <div className='form-group'>
                <label>
                <input className='playInLibraryCheckbox'
                  name='playInLibrary'
                  ref={(input) => { this.playInLibrary = input; }}
                  type='checkbox'
                  defaultValue={true}
                />
                  Play in Library
                </label>
              </div>
            </form>
            <img  className='image-preview' crossOrigin='use-credentials' src={this.state.track.thumbnail} />
          </div>
          <div className='col-lg-6'>
            <h3>Actions</h3>
            <div className='btn btn-primary' onClick={this.importTrack}>Import this Track</div>
            { this.containsDash() && <div>
              <h4>Format Options</h4>
              <div className='btn btn-default' onClick={() => this.setTitleBeforeDash(!this.state.titleBeforeDash)}>
                Switch title and artist
              </div>
            </div>}
          </div>
        </div>
        }
      </div>
    );
  }

  containsDash() {
    return this.state.track && this.state.track.title.indexOf('-') !== -1;
  }

  getAlbum(state = this.state) {
    return 'Unknown Album';
  }

  getArtist(state = this.state) {
    if (state.track && state.track.artist) return state.track.artist;
    if (!this.containsDash()) return state.track && (state.track.channel || state.track.title) || '';
    return state.track && state.track.title.split('-')[0].trim() || '';
  }

  getTitle(state = this.state) {
    if (state.track && state.track.artist && state.track.title) return state.track.title;
    if (!this.containsDash()) return state.track && state.track.title || '';
    return state.track && state.track.title.split('-')[1].trim() || '';
  }

  @autobind
  importTrack() {
    let song = Song.create({
      album: this.album.value,
      artist: this.artist.value,
      cover: this.state.track.thumbnail,
      discNumber: 0,
      duration: this.state.track.duration,
      explicit: this.explicit.checked || false,
      playInLibrary: this.playInLibrary.checked || false,
      genre: this.state.track.genre || 'Unknown',
      id: this.state.track.id,
      isSoundcloud: this.state.track.isSoundcloud || false,
      isYoutube: this.state.track.isYoutube || false,
      isAudius: this.state.track.isAudius || false,
      title: this.title.value,
      trackNumber: 0,
      url: this.state.track.url,
      year: this.state.track.year
    })
    Playlist.getByTitle(Playlist.LIBRARY).addSong(song);
    Alerter.success('Track added to Library');
    this.setState({
      track: null,
      playlistUrl: null,
      loading: false
    });
    this.album.value = '';
    this.artist.value = '';
    this.title.value = '';
    this.input.value = '';
    this.input.focus();
  }

  @autobind
  onChange() {
    this.setState({
      loading: !!this.input.value,
      track: null,
      playlistUrl: null,
      error: ''
    });
    this.timeout && clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (Youtube.isPlaylistUrl(this.input.value)) {
        const params = new URL(this.input.value).searchParams;
        this.setState({
          playlistUrl: `/mix/${params.get('v')}+${params.get('list')}`
        });
      }
      (Soundcloud.isSoundcloudURL(this.input.value) ?
        Soundcloud.getInfo(this.input.value) :
        (Audius.isAudiusURL(this.input.value) ?
          Audius.getInfo(this.input.value)
        : Youtube.getInfo(this.input.value)
      )).then((track) => {
        this.title && (this.title.value = this.getTitle());
        this.artist && (this.artist.value = (track.artist || this.getArtist()));
        this.album && (this.album.value = this.getAlbum());

        this.setState({
          track: track,
          loading: false
        });
      }).catch((error) => {
        console.log(error);
        this.setState({
          loading: false,
          error: 'unable to find that track'
        });
      });
    }, 1000);
  }

  @autobind
  setTitleBeforeDash(titleBeforeDash) {
    const oldTitle = this.title.value;
    this.title && (this.title.value = this.artist.value);
    this.artist && (this.artist.value = oldTitle);
  }
}