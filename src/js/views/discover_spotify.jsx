import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import SpotifyChart from './spotify_chart';

export default class DiscoverSpotify extends React.Component {
  render() {
    return (
      <Row>
        <Col md={6} xs={12}>
          <h2>Top 200</h2>
          <SpotifyChart type='top' />
        </Col>
        <Col md={6} xs={12}>
          <h2>Viral 50</h2>
          <SpotifyChart type='viral' />            
        </Col>
      </Row>
    );
  }
}