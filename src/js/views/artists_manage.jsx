import * as React from 'react';
import { Button, Col, Row, Image } from 'react-bootstrap';
import Utilities from '../utilities';
import Alerter from '../services/alerter';

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
        <h1>Manage Your Followed Artists</h1>
        <p>Click to unfollow an artist</p>
        { this.state.artists &&
          <Row>
            { this.state.artists.map(artist => (
              <Col key={artist.artistId} md={3}>
                <Image onClick={this._unfollow.bind(this, artist)} className='artistImage' src={artist.artistCover} />
                <h4 className='artistText'>{artist.artistName}</h4>
              </Col>
            )) }
          </Row>
        }
      </div>
    );
  }

  _unfollow(artistToUnfollow) {
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