import * as React from 'react';
import { Button, ButtonToolbar, DropdownButton, Media, MenuItem, Tabs, Tab } from 'react-bootstrap';
import Player from '../services/player';
import Playlist from '../models/playlist';
import Song from '../models/song';
import Soundcloud from '../services/soundcloud';
import Youtube from '../services/youtube';
import autobind from 'autobind-decorator';
import Audius from '../services/audius';

export default class Edit extends React.Component {
  constructor(props) {
    super(props);
    const track = Song.findById(this.props.match.params.id);
    if (!track) {
      this.cancel();
      return;
    }
    this.state = {
      album: track.album,
      artist: track.artist,
      cover: track.cover,
      title: track.title,
      track: track,
      explicit: track.explicit,
      playInLibrary: track.playInLibrary,
      url: track.url
    };
    this.fetchAlternatesAsync();
  }

  render() {
    if (!this.state || !this.state.track) {
      return null;
    }
    return (
      <div className='edit'>
        <div className='row'>
          <div className='col-sm-12'>
            <h3>
              Edit Track
              <Button className='pull-right' bsStyle='primary' onClick={this.save}>Save</Button>
              <Button className='pull-right cancelButton' bsStyle='default' onClick={this.cancel}>Cancel</Button>
            </h3>
            <Tabs defaultActiveKey={1} id='editingtabs'>
              <Tab eventKey={1} title='Information'>{this.informationTab()}</Tab>
              { (this.state.soundcloudSuggestions || this.state.youtubeSuggestions) &&
                <Tab eventKey={2} title='Find Backing Track'>
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
      url: this.url.value,
      explicit: this.explicit.checked,
      playInLibrary: this.playInLibrary.checked
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
          key={this.state.url}
          width='560'
          height='315'
          src={`https://www.youtube.com/embed/${Youtube.extractId(this.state.url)}`}
          frameBorder='0'
          allowFullScreen>
        </iframe>
      );
    } else if (Soundcloud.isSoundcloudURL(this.state.url)) {
      return (
        <iframe
          key={this.state.url}
          width='560'
          height='315'
          scrolling='no'
          frameBorder='no'
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
    } else if (Audius.isAudiusURL(url)) {
      return Audius.getInfo(url).then(info => info.id);
    }
  }

  informationTab() {
    return (
      <div className='tab-padding row'>
        <div className='col-sm-6'>
          <form>
            <div className='form-group'>
              <label htmlFor='title'>Title</label>
              <input className='form-control'
                     name='title'
                     onKeyUp={this.attributeModified}
                     ref={(input) => { this.title = input; }}
                     type='text'
                     defaultValue={this.state.title}
              />
            </div>
            <div className='form-group'>
              <label htmlFor='artist'>Artist</label>
              <input className='form-control'
                     name='artist'
                     onKeyUp={this.attributeModified}
                     ref={(input) => { this.artist = input; }}
                     type='text'
                     defaultValue={this.state.artist}
              />
            </div>
            <div className='form-group'>
              <label htmlFor='album'>Album</label>
              <input className='form-control'
                     name='album'
                     onKeyUp={this.attributeModified}
                     ref={(input) => { this.album = input; }}
                     type='text'
                     defaultValue={this.state.album}
              />
            </div>
            <div className='form-group'>
              <label htmlFor='cover'>Cover</label>
              <input className='form-control'
                     name='cover'
                     onKeyUp={this.attributeModified}
                     ref={(input) => { this.cover = input; }}
                     type='text'
                     defaultValue={this.state.cover}
              />
            </div>
            <div className='form-group'>
              <label htmlFor='url'>Backing URL</label>
              <input className='form-control'
                     name='url'
                     onKeyUp={this.attributeModified}
                     ref={(input) => { this.url = input; }}
                     type='text'
                     defaultValue={this.state.url}
              />
            </div>
            <div className='form-group'>
                <label>
                <input className='explicitCheckbox'
                  name='explicit'
                  onChange={this.attributeModified}
                  ref={(input) => { this.explicit = input; }}
                  type='checkbox'
                  defaultChecked={this.state.explicit}
                />
                  Explicit
                </label>
              </div>
              <div className='form-group'>
                  <label>
                  <input className='playInLibraryCheckbox'
                    name='playInLibrary'
                    onChange={this.attributeModified}
                    ref={(input) => { this.playInLibrary = input; }}
                    type='checkbox'
                    defaultChecked={this.state.playInLibrary}
                  />
                    Play in Library
                  </label>
                </div>
          </form>
        </div>
        <div className='col-sm-6'>
          <h4>Image Preview</h4>
          <img  className='image-preview' crossOrigin='use-credentials' src={this.state.cover} />
          <h4>Backing Track</h4>
          { this.embedPlayer() }
        </div>
      </div>
    );
  }

  @autobind
  cancel() {
    window.lastRoute ?
      this.props.history.goBack() :
      this.props.history.push(`/playlist/${Playlist.LIBRARY}`);
  }

  isYoutube() {
    return this.state.url.indexOf('youtu') > -1;
  }

  @autobind
  playTrack(track) {
    const song = new Song({
      artist: track.channel,
      cover: track.thumbnail,
      id: track.id,
      isSoundcloud: track.isSoundcloud,
      isYoutube: track.isYoutube,
      isAudius: track.isAudius,
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
    track.album = this.state.album;
    track.cover = this.state.cover;
    track.url = this.state.url;
    track.explicit = this.state.explicit;
    track.playInLibrary = this.state.playInLibrary;
    track.isSoundcloud = Soundcloud.isSoundcloudURL(this.state.url);
    track.isYoutube = Youtube.isYoutubeURL(this.state.url);
    track.isAudius = Audius.isAudiusURL(this.state.url);
    this.findIdForUrl(this.state.url).then((newId) => {
      const oldId = track.id;
      track.setId(newId);
      if (track.id !== oldId) {
        Playlist.updateIds(oldId, track.id);
      }
      window.lastRoute ?
        this.props.history.goBack() :
        this.props.history.push(`/playlist/${Playlist.LIBRARY}`);
      Song.change();
    });
  }

  @autobind
  suggestionItem(item) {
    return (
      <Media key={'editItem' + item.id}>
        <Media.Left>
          <img className='media-object preview-thumbnail' src={item.thumbnail}/>
        </Media.Left>
        <Media.Body>
          <Media.Heading className='media-heading'>{item.title}</Media.Heading>
          <p>
            Artist: {item.channel}
          </p>
          <ButtonToolbar>
            <Button bsSize='small' bsStyle='primary' onClick={this.playTrack.bind(this, item)}>Play Track</Button>
            <DropdownButton id='useItemDropdown' bsSize='small' title='Use Metadata'>
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
      <div className='tab-padding row'>
        <div className='col-sm-6'>
          <h4>From Youtube</h4>
          {this.state.youtubeSuggestions && this.state.youtubeSuggestions.map(this.suggestionItem)}
        </div>
        <div className='col-sm-6'>
          <h4> From SoundCloud</h4>
          {this.state.soundcloudSuggestions && this.state.soundcloudSuggestions.map(this.suggestionItem)}
        </div>
      </div>
    );
  }
}
