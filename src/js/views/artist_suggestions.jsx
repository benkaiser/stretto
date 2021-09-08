import * as React from 'react';
import { Alert, Col, Row, Image } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import Utilities from '../utilities';
import Alerter from '../services/alerter';
import { Link } from 'react-router-dom';

export default class ArtistSuggestions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this._loadArtists();
  }

  render() {
    return (
      <div className='intro'>
        <div class="playlist_header">
            <h1>Select Artists to Follow</h1>
            <div class="buttons">
              <Link className='btn btn-primary' to='/artists/feed'>Artist Feed</Link>
              <Link className='btn btn-primary' to='/artists/manage'>Manage Artists</Link>
            </div>
        </div>

        { this.state.loading &&
          <React.Fragment>
            <p>Loading artists...</p>
            <Spinner />
          </React.Fragment>
        }
        { this.state.error &&
          <Alert bsStyle='danger'>
            <strong>{this.state.error}</strong>
          </Alert>
        }
        { this.state.artists &&
          <Row className="artistsBody">
            { this.state.artists.map(artist => (
              <Col key={artist.artistId} md={3}>
                <Image onClick={this._follow.bind(this, artist)} className='artistImage' src={artist.artistCover} />
                <h4 className='artistText'>{artist.artistName}</h4>
              </Col>
            )) }
          </Row>
        }
        { (!this.state.artists || this.state.artists.length === 0) && !this.state.error && !this.state.loading &&
          <div>
            <h2 className="mt-0">No suggestions found</h2>
            <p>Artist suggestions are based on the songs in your library, add more songs to see more suggestions!</p>
          </div>
        }
      </div>
    );
  }

  _follow(artistToFollow) {
    Alerter.success(`Followed ${ artistToFollow.artistName }`);

    this.setState({
      artists: this.state.artists.filter(artist => artist !== artistToFollow),
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
      if (!responseJson.error) {
        this.setState({
          loading: false,
          artists: responseJson
        });
      } else {
        this.setState({
          loading: false,
          error: responseJson.error
        });
      }
    });
  }
}