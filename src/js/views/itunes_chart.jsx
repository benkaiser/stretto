import * as React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import Spinner from 'react-spinkit';

import Itunes from '../services/itunes';

export default class ItunesChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
    this._fetchChart();
  }

  render() {
    if (this.state.loaded) {
      return (
        <div>
          { this.state.items.map(item => 
            <div>{item.title} - {item.artist}</div>
          )}
        </div>
      )
    } else {
      return <Spinner name='three-bounce' />;
    }
  }

  _fetchChart() {
    Itunes.fetchChart(this.props.chartType)
    .then(results => {
      console.log(results);
      this.setState({
        items: results,
        loaded: true
      });
    });
  }
}