import { h, Component } from 'preact';
import { Alert } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import Alerter from '../services/alerter';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from '../services/soundcloud';
import Youtube from '../services/youtube';
import autobind from 'autobind-decorator';

class Add extends Component {
  constructor() {
    super();
    this.state = {
      titleBeforeDash: true
    };
  }

  componentDidMount() {
    this.input && this.input.focus && this.input.focus();
  }

  shouldComponentUpdate(newProps, newState) {
    return this.state.titleBeforeDash != newState.titleBeforeDash ||
      this.state.track != newState.track ||
      this.state.loading != newState.loading ||
      this.state.error != newState.error;
  }

  render() {
    return (
      <div class='add'>
        <h1>Add a Song from Youtube or Soundcloud</h1>
        <form>
          <div class="form-group">
            <label for="songurl">Song URL</label>
            <input class='form-control'
                   onkeyup={this.onChange}
                   placeholder='https://youtube.com/... or https://soundcloud.com/...'
                   ref={(input) => { this.input = input; }}
                   type='text'
                   name='songurl'
            />
          </div>
        </form>
        <div class='addLoading'>
        { this.state.loading &&
          <div><Spinner name="line-scale" /></div>
        }
        { this.state.error &&
          <Alert bsStyle="danger">
            <strong>Oh no!</strong> Looks like we are {this.state.error}
          </Alert>
        }
        </div>
        { this.state.track &&
        <div class='row'>
          <div class='col-lg-6'>
            <h3>Track Information</h3>
            <form>
              <div class="form-group">
                <label for="title">Title</label>
                <input class='form-control'
                       name='title'
                       onkeyup={this.attributeModified}
                       ref={(input) => { this.title = input; }}
                       type='text'
                       value={this.getTitle()}
                />
              </div>
              <div class="form-group">
                <label for="artist">Artist</label>
                <input class='form-control'
                       name='artist'
                       onkeyup={this.attributeModified}
                       ref={(input) => { this.artist = input; }}
                       type='text'
                       value={this.getArtist()}
                />
              </div>
              <div class="form-group">
                <label for="album">Album</label>
                <input class='form-control'
                       name='album'
                       onkeyup={this.attributeModified}
                       ref={(input) => { this.album = input; }}
                       type='text'
                       value={this.getAlbum()}
                />
              </div>
            </form>
            <div class='image-preview' style={`background-image: url('${this.state.track.thumbnail}')`} />
          </div>
          <div class='col-lg-6'>
            <h3>Actions</h3>
            <div class='btn btn-primary' onClick={this.importTrack}>Import this Track</div>
            { this.containsDash() && <div>
              <h4>Format Options</h4>
              <div class='btn btn-default' onClick={() => this.setTitleBeforeDash(!this.state.titleBeforeDash)}>
                Switch title and artist
              </div>
            </div>}
          </div>
        </div>
        }
      </div>
    );
  }

  @autobind
  attributeModified() {
    this.setState({
      artist: this.artist.value,
      album: this.album.value,
      title: this.title.value
    });
  }

  containsDash() {
    return this.state.track && this.state.track.title.indexOf('-') !== -1;
  }

  getAlbum(state = this.state) {
    if (state.album) return state.album;
    return 'Unknown Album';
  }

  getArtist(state = this.state) {
    if (state.artist) return state.artist;
    if (!this.containsDash()) return state.track && (state.track.channel || state.track.title) || '';
    return state.track && state.track.title.split('-')[
      state.titleBeforeDash ? 1 : 0
    ].trim() || '';
  }

  getTitle(state = this.state) {
    if (state.title) return state.title;
    if (!this.containsDash()) return state.track && state.track.title || '';
    return state.track && state.track.title.split('-')[
      state.titleBeforeDash ? 0 : 1
    ].trim() || '';
  }

  @autobind
  importTrack() {
    let song = Song.create({
      album: this.getAlbum(),
      artist: this.getArtist(),
      cover: this.state.track.thumbnail,
      discNumber: 0,
      duration: this.state.track.duration,
      explicit: false,
      genre: this.state.track.genre || 'Unknown',
      id: this.state.track.id,
      isSoundcloud: this.state.track.isSoundcloud,
      isYoutube: this.state.track.isYoutube,
      title: this.getTitle(),
      trackNumber: 0,
      url: this.state.track.url,
      year: this.state.track.year
    })
    Playlist.getByTitle(Playlist.LIBRARY).addSong(song);
    Alerter.success('Track added to Library');
    this.setState({
      titleBeforeDash: true,
      track: null,
      artist: undefined,
      album: undefined,
      title: undefined,
      loading: false
    });
    this.input.value = '';
    this.input.focus();
  }

  @autobind
  onChange() {
    this.setState({
      loading: !!this.input.value,
      error: ''
    });
    this.timeout && clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      (Soundcloud.isSoundcloudURL(this.input.value) ?
        Soundcloud.getInfo(this.input.value) :
        Youtube.getInfo(this.input.value)
      ).then((track) => {
        this.setState({
          artist: undefined,
          album: undefined,
          title: undefined,
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
    delete this.state.artist;
    delete this.state.title;
    this.setState({
      titleBeforeDash: titleBeforeDash
    });
  }
}

module.exports = Add;
