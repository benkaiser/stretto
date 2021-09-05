import * as React from 'react';
import { Button, Col, Row, Image } from 'react-bootstrap';
import Utilities from '../utilities';
import Alerter from '../services/alerter';
import { Link } from 'react-router-dom';

export default class ArtistsManage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      following: []
    };
  }

  componentDidMount() {
    this._loadArtists();
  }

  render() {
    return (
      <div className='intro'>
        <div class="playlist_header">
            <h1>Your Followed Artists</h1>
            <div class="buttons">
              <Link className='btn btn-primary' to='/artists/feed'>Artist Feed</Link>
              <Link className='btn btn-primary' to='/artists/add'>Artist Suggestions</Link>
            </div>
        </div>
        { this.state.artists &&
          <Row>
            { this.state.artists.map(artist => (
              <Col key={artist.artistId} md={3}>
                <Image onClick={this._searchArtist.bind(this, artist)} className='artistImage' src={artist.artistCover} />
                <i onClick={this._unfollow.bind(this, artist)} className='fa fa-close fa-2x unfollowClose'></i>
                <h4 className='artistText'>{artist.artistName}</h4>
              </Col>
            )) }
          </Row>
        }
      </div>
    );
  }

  _unfollow(artistToUnfollow, event) {
    event.preventDefault();
    event.stopPropagation();
    this.setState({
      artists: this.state.artists.filter(artist => artist !== artistToUnfollow)
    });
    Alerter.success(`Unfollowed ${ artistToUnfollow.artistName }`);
    return fetch('/artists/unfollow', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        artist: artistToUnfollow
      })
    });
  }

  _searchArtist(artist, event) {
    this.props.history.push(`/search/${artist.artistName}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  _loadArtists() {
    fetch('/artists/followed/raw')
    .then(Utilities.fetchToJson)
    .then(responseJson => {
      this.setState({
        loading: false,
        artists: responseJson
      });
    });
  }
}