import * as React from 'react';
import autobind from 'autobind-decorator';
import { Col, DropdownButton, MenuItem, Row } from 'react-bootstrap';
import ItunesChart from './itunes_chart';

const genres = {
  20: 'Alternative',
  2: 'Blues',
  3: 'Comedy',
  4: 'Children\'s Music',
  5: 'Classical',
  6: 'Country',
  7: 'Electronic',
  8: 'Holiday',
  9: 'Opera',
  10: 'Singer/Songwriter',
  11: 'Jazz',
  12: 'Latino',
  14: 'Pop',
  15: 'R&B/Soul',
  16: 'Soundtrack',
  17: 'Dance',
  18: 'Hip-Hop/Rap',
  19: 'World',
  21: 'Rock',
  22: 'Christian & Gospel',
  23: 'Vocal',
  29: 'Anime',
  25: 'Easy Listening',
  28: 'Enka',
  50: 'Fitness & Workout',
  53: 'Instrumental',
  27: 'J-Pop',
  51: 'K-Pop',
  13: 'New Age',
  24: 'Reggae'
};

export default class DiscoverItunes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      genreNumber: 14
    };
  }

  render() {
    return (
      <Row>
        <Col md={6} xs={12}>
          <h2>Top Songs</h2>
          <ItunesChart />
        </Col>
        <Col md={6} xs={12}>
          <h2>Top {genres[this.state.genreNumber]} 

          <div className='pull-right'>
            <DropdownButton
              pullRight
              bsStyle='default'
              title={'Change Genre'}
              onSelect={this.onSelectGenre}
              id='genre-dropdown'
            >
              { Object.keys(genres).map(key => 
                <MenuItem key={key} eventKey={key} active={this.state.genreNumber == key}>{genres[key]}</MenuItem>
              ) }
            </DropdownButton>
          </div>
          </h2>
          <ItunesChart chartOptions={ { genreCode: this.state.genreNumber } } />            
        </Col>
      </Row>
    );
  }

  @autobind
  onSelectGenre(genreNumber) {
    this.setState({
      genreNumber
    });
  }
}