import * as React from 'react';
import { Button, Col, Row, Image } from 'react-bootstrap';
import Utilities from '../utilities';

export default class ArtistsFeed extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true
    };
  }

  componentDidMount() {
    this._loadFeed();
  }

  render() {
    return (
      <div className='intro'>
        <h1>Your Artist Feed</h1>
        { this.state.tracks &&
          <Row>
            { this.state.tracks.map(track => (
              <Col key={track.trackId} md={12}>
                <h4 className='track'>{track.trackName}</h4>
                <Image onClick={this._follow.bind(this, artist)} className={`artistImage ${artist.following ? 'followingArtist' : ''}`} src={artist.artistCover} />
              </Col>
            )) }
          </Row>
        }
      </div>
    );
  }

  _loadFeed() {
    fetch('/artists/feed')
    .then(Utilities.fetchToJson)
    .then(responseJson => {
      this.setState({
        loading: false,
        feed: responseJson
      });
    });
  }
}