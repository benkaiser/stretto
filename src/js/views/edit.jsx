import { h, Component } from 'preact';
import { Button, ButtonToolbar, DropdownButton, Media, MenuItem, Tabs, Tab } from 'react-bootstrap';
import Player from '../services/player';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from '../services/soundcloud';
import Youtube from '../services/youtube';
import autobind from 'autobind-decorator';

export default class Edit extends Component {
  constructor(props) {
    super(props);
    const track = Song.findById(this.props.params.id);
    this.state = {
      album: track.album,
      artist: track.artist,
      cover: track.cover,
      title: track.title,
      track: track,
      url: track.url
    };
    this.fetchAlternatesAsync();
  }

  render() {
    return (
      <div class='edit'>
        <div class='row'>
          <div class='col-sm-12'>
            <h3>
              Edit Track
              <Button className='pull-right' bsStyle='primary' onClick={this.save}>Save</Button>
            </h3>
            <Tabs defaultActiveKey={1} id="editingtabs">
              <Tab eventKey={1} title="Information">{this.informationTab()}</Tab>
              { (this.state.soundcloudSuggestions || this.state.youtubeSuggestions) &&
                <Tab eventKey={2} title="Find Backing Track">
                  { this.suggestions() }
                </Tab>
              }
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  @autobind
  attributeModified() {
    this.fetchTimeout && clearTimeout(this.fetchTimeout);
    this.fetchTimeout = setTimeout(() => {
      this.fetchAlternatesAsync();
    }, 1000);
    this.setState({
      artist: this.artist.value,
      album: this.album.value,
      cover: this.cover.value,
      title: this.title.value,
      url: this.url.value
    });
  }

  changeAllInfo(item) {
    this.setState({
      artist: item.channel,
      cover: item.thumbnail,
      id: item.id,
      title: item.title,
      url: item.url
    });
    this.title.value = item.title;
    this.artist.value = item.channel;
    this.url.value = item.url;
    this.cover.value = item.thumbnail;
  }

  changeInfo(field, value) {
    this.setState({
      [field]: value
    });
    if (this[field]) {
      this[field].value = value;
    }
  }

  embedPlayer() {
    if (Youtube.isYoutubeURL(this.state.url)) {
      return (
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${Youtube.extractId(this.state.url)}`}
          frameborder="0"
          allowfullscreen>
        </iframe>
      );
    } else if (Soundcloud.isSoundcloudURL(this.state.url)) {
      return (
        <iframe
          width="560"
          height="315"
          scrolling="no"
          frameborder="no"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(this.state.url)}&amp;color=%23ff5500&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;visual=true`}
        >
        </iframe>
      );
    }
  }

  fetchAlternatesAsync() {
    const searchString = `${this.state.title} ${this.state.artist}`;
    Youtube.search(searchString)
    .then((tracks) => {
      this.setState({
        youtubeSuggestions: tracks
      });
    });
    Soundcloud.search(searchString)
    .then((tracks) => {
      this.setState({
        soundcloudSuggestions: tracks
      });
    })
  }

  findIdForUrl(url) {
    if (Youtube.isYoutubeURL(url)) {
      return Promise.resolve(Youtube.extractId(url));
    } else if (Soundcloud.isSoundcloudURL(url)) {
      return Soundcloud.extractId(url);
    } else {
      return Promise.resolve(this.state.id);
    }
  }

  informationTab() {
    return (
      <div class='tab-padding row'>
        <div class='col-sm-6'>
          <form>
            <div class="form-group">
              <label for="title">Title</label>
              <input class='form-control'
                     name='title'
                     onkeyup={this.attributeModified}
                     ref={(input) => { this.title = input; }}
                     type='text'
                     value={this.state.title}
              />
            </div>
            <div class="form-group">
              <label for="artist">Artist</label>
              <input class='form-control'
                     name='artist'
                     onkeyup={this.attributeModified}
                     ref={(input) => { this.artist = input; }}
                     type='text'
                     value={this.artist && this.artist.value || this.state.artist}
              />
            </div>
            <div class="form-group">
              <label for="album">Album</label>
              <input class='form-control'
                     name='album'
                     onkeyup={this.attributeModified}
                     ref={(input) => { this.album = input; }}
                     type='text'
                     value={this.album && this.album.value || this.state.album}
              />
            </div>
            <div class="form-group">
              <label for="cover">Cover</label>
              <input class='form-control'
                     name='cover'
                     onkeyup={this.attributeModified}
                     ref={(input) => { this.cover = input; }}
                     type='text'
                     value={this.cover && this.cover.value || this.state.cover}
              />
            </div>
            <div class="form-group">
              <label for="url">Backing URL</label>
              <input class='form-control'
                     name='url'
                     onkeyup={this.attributeModified}
                     ref={(input) => { this.url = input; }}
                     type='text'
                     value={this.url && this.url.value || this.state.url}
              />
            </div>
          </form>
        </div>
        <div class='col-sm-6'>
          <h4>Image Preview</h4>
          <div class='image-preview' style={`background-image: url('${this.state.cover}')`} />
          <h4>Backing Track</h4>
          { this.embedPlayer() }
        </div>
      </div>
    );
  }

  isYoutube() {
    return this.state.url.indexOf('youtu') > -1;
  }

  @autobind
  playTrack(track) {
    const song = new Song({
      artist: track.channel,
      cover: track.thumbnail,
      id: track.id.videoId,
      isSoundcloud: track.isSoundcloud,
      isYoutube: track.isYoutube,
      title: track.title,
      url: track.url
    });
    Player.play(song);
  }

  @autobind
  save() {
    const track = this.state.track;
    track.title = this.state.title;
    track.artist = this.state.artist;
    track.cover = this.state.cover;
    track.url = this.state.url;
    track.isSoundcloud = Soundcloud.isSoundcloudURL(this.state.url);
    track.isYoutube = Youtube.isYoutubeURL(this.state.url);
    this.findIdForUrl(this.state.url).then((newId) => {
      const oldId = track.id;
      track.setId(newId);
      if (track.id !== oldId) {
        Playlist.updateIds(oldId, track.id);
      }
      window.lastRoute ?
        this.props.router.push(window.lastRoute) :
        this.props.router.push(`/playlist/${Playlist.LIBRARY}`);
      Song.change();
    });
  }

  @autobind
  suggestionItem(item) {
    return (
      <Media>
        <Media.Left>
          <img class="media-object preview-thumbnail" src={item.thumbnail}/>
        </Media.Left>
        <Media.Body>
          <Media.Heading class="media-heading">{item.title}</Media.Heading>
          <p>
            Artist: {item.channel}
          </p>
          <ButtonToolbar>
            <Button bsSize="small" bsStyle="primary" onClick={this.playTrack.bind(this, item)}>Play Track</Button>
            <DropdownButton bsSize="small" title="Use Metadata" rootCloseEvent='mousedown'>
              <MenuItem onClick={this.changeAllInfo.bind(this, item)}>All</MenuItem>
              <MenuItem onClick={this.changeInfo.bind(this, 'url', item.url)}>Only backing track</MenuItem>
              <MenuItem onClick={this.changeInfo.bind(this, 'cover', item.thumbnail)}>Only cover</MenuItem>
              <MenuItem onClick={this.changeInfo.bind(this, 'title', item.title)}>Only title</MenuItem>
              <MenuItem onClick={this.changeInfo.bind(this, 'artist', item.channel)}>Only channel for artist</MenuItem>
            </DropdownButton>
          </ButtonToolbar>
        </Media.Body>
      </Media>
    );
  }

  suggestions() {
    return (
      <div class='tab-padding row'>
        <div class='col-sm-6'>
          <h4>From Youtube</h4>
          {this.state.youtubeSuggestions && this.state.youtubeSuggestions.map(this.suggestionItem)}
        </div>
        <div class='col-sm-6'>
          <h4> From SoundCloud</h4>
          {this.state.youtubeSuggestions && this.state.soundcloudSuggestions.map(this.suggestionItem)}
        </div>
      </div>
    );
  }
}
