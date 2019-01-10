import * as React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import ItunesChart from './itunes_chart';

export default class Discover extends React.Component {
  render() {
    return (
      <div className='intro'>
        <h1>Top Charts</h1>
        <Row>
          <Col md={3} xs={12}>
            <p>Top Songs</p>
            <ItunesChart chartType='top' />
          </Col>
          <Col md={3} xs={12}>
            <p>Top Electronic</p>
            
          </Col>
        </Row>
      </div>
    );
  }
}