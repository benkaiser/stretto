import * as React from 'react';
import { DropdownButton, Col, MenuItem, Panel, Row } from 'react-bootstrap';

export default class Intro extends React.Component {
  render() {
    return (
      <div className='intro'>
        <div class="jumbotron">
          <h1>Welcome to Stretto</h1>
          <p>Stretto is an <a href='https://github.com/benkaiser/stretto'>open-source</a> web-based music player</p>
          <DropdownButton
            bsStyle='primary'
            bsSize='large'
            title='Import to Stretto'
            id={`dropdown-import`}
            onSelect={this._onSelect.bind(this)}
          >
            <MenuItem eventKey="/spotify">From Spotify</MenuItem>
            <MenuItem eventKey="/add">From Youtube/Soundcloud</MenuItem>
            <MenuItem eventKey="/discover">From Top Charts</MenuItem>
            <MenuItem divider />
            <MenuItem eventKey="/import">From last Stretto version</MenuItem>
          </DropdownButton>
        </div>
        <Row className='displayFlex'>
          <Col className='displayFlex' lg={4} md={6} sm={12}>
            <Panel bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-youtube' aria-hidden='true'></i>
                  <span className='titleSpan'>Millions of Songs</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>Your music is backed by tracks from youtube and soundcloud, your library is unlimited</Panel.Body>
            </Panel>
          </Col>
          <Col className='displayFlex' lg={4} md={6} sm={12}>
            <Panel bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-headphones' aria-hidden='true'></i>
                  <span className='titleSpan'>Listen Ad Free</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
              Listen to the music you love, uninterupted thanks to ad blockers (
                <a target='_blank' href='https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm?hl=en'>Chrome</a>
                {' and '}
                <a target='_blank' href='https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/'>Firefox</a>
                ).
              </Panel.Body>
            </Panel>
          </Col>
          <Col className='displayFlex' lg={4} md={6} sm={12}>
            <Panel bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-music' aria-hidden='true'></i>
                  <span className='titleSpan'>Discover New Music</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>With access to the top hits from iTunes and Spotify, you can always find new music</Panel.Body>
            </Panel>
          </Col>
        </Row>
      </div>
    );
  }

  _onSelect(url) {
    this.props.history.push(url);
  }
}