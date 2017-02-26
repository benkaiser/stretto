import { h, Component } from 'preact';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Youtube from '../services/youtube';

class Add extends Component {
  constructor() {
    super();
    this.state = {
      titleBeforeDash: true
    };
  }

  render() {
    return (
      <div class='intro'>
        <h1>Add a Song from Youtube</h1>
        <form>
          <div class="form-group">
            <label for="songurl">Song URL</label>
            <input class='form-control'
                   onkeyup={this.onChange.bind(this)}
                   placeholder='https://youtube.com/...'
                   ref={(input) => { this.input = input; }}
                   type='text'
                   name='songurl'
            />
          </div>
        </form>
        { this.state.track &&
        <div class='row'>
          <div class='col-lg-6'>
            <h3>Track Information</h3>
            <form>
              <div class="form-group">
                <label for="title">Title</label>
                <input class='form-control'
                       name='title'
                       onkeyup={this.attributeModified.bind(this)}
                       ref={(input) => { this.title = input; }}
                       type='text'
                       value={this.getTitle()}
                />
              </div>
              <div class="form-group">
                <label for="artist">Artist</label>
                <input class='form-control'
                       name='artist'
                       onkeyup={this.attributeModified.bind(this)}
                       ref={(input) => { this.artist = input; }}
                       type='text'
                       value={this.getArtist()}
                />
              </div>
              <div class="form-group">
                <label for="album">Album</label>
                <input class='form-control'
                       name='album'
                       onkeyup={this.attributeModified.bind(this)}
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
            <div class='btn btn-primary' onClick={this.importTrack.bind(this)}>Import this Track</div>
            { this.containsDash() && <div>
              <h4>Format Options</h4>
              <div class='btn btn-default' onClick={this.setTitleBeforeDash.bind(this, true)}>Title - Artist</div>
              <div class='btn btn-default' onClick={this.setTitleBeforeDash.bind(this, false)}>Artist - Title</div>
            </div>}
          </div>
        </div>
        }
      </div>
    );
  }

  attributeModified() {
    this.setState({
      artist: this.artist.value,
      album: this.album.value,
      title: this.title.value
    });
  }

  containsDash() {
    return this.state.track.title.indexOf('-');
  }

  getAlbum() {
    if (this.state.album) return this.state.album;
    return 'Unknown Album';
  }

  getArtist() {
    if (this.state.artist) return this.state.artist;
    if (!this.containsDash()) return this.state.track.title;
    return this.state.track.title.split('-')[
      this.state.titleBeforeDash ? 1 : 0
    ].trim();
  }

  getTitle() {
    if (this.state.title) return this.state.title;
    if (!this.containsDash()) return this.state.track.title;
    return this.state.track.title.split('-')[
      this.state.titleBeforeDash ? 0 : 1
    ].trim();
  }

  importTrack() {
    let song = Song.create({
      album: this.getAlbum(),
      artist: this.getArtist(),
      cover: this.state.track.thumbnail,
      discNumber: 0,
      explicit: false,
      genre: 'Unknown',
      id: this.state.track.id,
      isYoutube: true,
      title: this.getTitle(),
      trackNumber: 0
    })
    Playlist.getByUrl('Library').addSong(song);
  }

  onChange() {
    this.timeout && clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      Youtube.getInfo(this.input.value).then((track) => {
        this.setState({
          track: track
        });
      });
    }, 1000);
  }

  setTitleBeforeDash(titleBeforeDash) {
    delete this.state.artist;
    delete this.state.title;
    this.setState({
      titleBeforeDash: titleBeforeDash
    });
  }
}

module.exports = Add;
