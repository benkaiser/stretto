import * as React from 'react';
import { Link } from 'react-router-dom';
import { Col, Panel, Row } from 'react-bootstrap';

export default class Intro extends React.Component {
  render() {
    return (
      <div className='intro'>
        <div class="jumbotron">
          <h1>Welcome to Stretto</h1>
          <p>Stretto is an open-source web-based music player</p>
        </div>
        <Row>
          <Col lg={4} md={6} sm={12}>
            <Panel className='introPanel' bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-youtube' aria-hidden='true'></i>
                  <span className='titleSpan'>Massive Library</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>Add to your library from youtube and soundcloud, millions of songs available</Panel.Body>
            </Panel>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <Panel className='introPanel' bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-headphones' aria-hidden='true'></i>
                  <span className='titleSpan'>Unlimited Ad-Free Listening</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
              Listen to the music you love, uninterupted thanks to ad blockers (
                <a target='_blank' href='https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm?hl=en'>uBlock Origin Chrome</a>
                {' - '}
                <a target='_blank' href='https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/'>uBlock Origin Firefox</a>
                ).
              </Panel.Body>
            </Panel>
          </Col>
          <Col lg={4} md={6} sm={12}>
            <Panel className='introPanel' bsStyle="primary">
              <Panel.Heading>
                <Panel.Title componentClass="h3" className='introPanelTitle'>
                  <i className='fa fa-github' aria-hidden='true'></i>
                  <span className='titleSpan'>Open Source</span>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>Built by members of the community in the open on <a href='https://github.com/benkaiser/stretto'>Github</a>.</Panel.Body>
            </Panel>
          </Col>
        </Row>
      </div>
    );
  }
}