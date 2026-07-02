import * as React from 'react';
import { DropdownButton, Card, Col, Dropdown, Row } from 'react-bootstrap';

export default class Intro extends React.Component {
  render() {
    return (
      <div className='intro'>
        <div className="jumbotron">
          <h1>Welcome to Stretto</h1>
          <p>Stretto is an <a href='https://github.com/benkaiser/stretto'>open-source</a> web-based music player</p>
          <DropdownButton
            variant='primary'
            size='lg'
            title='Import to Stretto'
            id={`dropdown-import`}
            onSelect={this._onSelect.bind(this)}
          >
            <Dropdown.Item eventKey="/spotify">From Spotify</Dropdown.Item>
            <Dropdown.Item eventKey="/add">From YouTube/SoundCloud</Dropdown.Item>
            <Dropdown.Item eventKey="/discover">From Top Charts</Dropdown.Item>
          </DropdownButton>
        </div>
        <Row>
          <Col lg={4} md={6} sm={12}>
            <Card border="primary">
              <Card.Header>
                <Card.Title as="h3" className='introPanelTitle'>
                  <i className='fa fa-youtube' aria-hidden='true'></i>
                  <span className='titleSpan'>Millions of Songs</span>
                </Card.Title>
              </Card.Header>
              <Card.Body>Your music is backed by tracks from YouTube and SoundCloud, your library is unlimited</Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <Card border="primary">
              <Card.Header>
                <Card.Title as="h3" className='introPanelTitle'>
                  <i className='fa fa-music' aria-hidden='true'></i>
                  <span className='titleSpan'>Discover New Music</span>
                </Card.Title>
              </Card.Header>
              <Card.Body>With access to the top hits from iTunes and Spotify, you can always find new music</Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <Card border="primary">
              <Card.Header>
                <Card.Title as="h3" className='introPanelTitle'>
                  <i className='fa fa-headphones' aria-hidden='true'></i>
                  <span className='titleSpan'>Listen Ad Free</span>
                </Card.Title>
              </Card.Header>
              <Card.Body>
              Listen to the music you love, uninterupted with the <a href='https://github.com/benkaiser/Stretto-Helper-Extension'>Stretto Helper extension</a>.
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  _onSelect(url) {
    this.props.history.push(url);
  }
}
