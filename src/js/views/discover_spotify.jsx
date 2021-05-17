import * as React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import SpotifyChart from './spotify_chart';
import SpotifyAPI from '../services/spotify_api';
import autobind from 'autobind-decorator';

export default class DiscoverSpotify extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: SpotifyAPI.instance.connected
    };
  }
  render() {
    if (this.state.connected) {
      return this.connectedView();
    } else {
      return this.showConnect();
    }
  }

  connectedView() {
    return (
      <Row>
        <Col md={6} xs={12}>
          <h2>Top 50 Global</h2>
          <SpotifyChart type='top' />
        </Col>
        <Col md={6} xs={12}>
          <h2>Viral 50 Global</h2>
          <SpotifyChart type='viral' />
        </Col>
      </Row>
    );
  }

  showConnect() {
    return (
      <div style={({ marginTop: 20})} className='text-center'>
        <Button bsStyle='primary' onClick={this._login}>Connect to Spotify</Button>
      </div>
    );
  }

  @autobind
  _login() {
    SpotifyAPI.instance.login().then(() => {
      this.setState({
        connected: true
      });
    });
  }
}