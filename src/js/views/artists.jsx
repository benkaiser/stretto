import * as React from 'react';
import { Button, Col, Row, Image } from 'react-bootstrap';
import Utilities from '../utilities';

export default class Artists extends React.Component {
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
        <h1>Select Your Favorite Artists</h1>
        { this.state.artists &&
          <Row>
            { this.state.artists.map(artist => (
              <Col key={artist.artistId} md={3}>
                <h4 className='artistText'>{artist.artistName}</h4>
                <Image onClick={this._follow.bind(this, artist)} className={`artistImage ${artist.following ? 'followingArtist' : ''}`} src={artist.artistCover} />
              </Col>
            )) }
          </Row>
        }
        { this.state.following.length > 0 && (
          <Button bsStyle='primary' onClick={this._goToFeed.bind(this)}>Go To Feed</Button>
        )}
      </div>
    );
  }

  _goToFeed() {
    this.props.history.push('/artists/feed');
  }

  _follow(artistToFollow) {
    this.setState({
      following: this.state.following.concat(artistToFollow),
      artists: this.state.artists.map(artist => {
        if (artistToFollow === artist) {
          return {
            ...artist,
            following: true
          };
        }
        return artist;
      })
    });
    return fetch('/artists/follow', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        artist: artistToFollow
      })
    });
  }

  _loadArtists() {
    fetch('/suggest/artists')
    .then(Utilities.fetchToJson)
    .then(responseJson => {
      this.setState({
        loading: false,
        artists: responseJson
      });
    });
  }
}