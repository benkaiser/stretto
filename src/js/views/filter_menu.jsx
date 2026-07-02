import * as React from 'react';
import { Dropdown } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import Song from '../models/song';

export default class FilterMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      offlineOnly: localStorage.getItem('offlineOnly') === 'true',
      cleanOnly: localStorage.getItem('cleanOnly') === 'true',
    };
  }

  render() {
    return (
      <Dropdown className='float-end' id={this.props.id} onSelect={this._onFilter}>
        <Dropdown.Toggle variant='link' className={this.props.navbar ? 'navbar-toggler no-caret' : ''}>
          <i className="fa fa-filter"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item eventKey="offlineOnly">{ this.state.offlineOnly ? <i className="fa fa-check"></i> : <i className="fa fa-times"></i> } Offline Only</Dropdown.Item>
          <Dropdown.Item eventKey="cleanOnly">{ this.state.cleanOnly ? <i className="fa fa-check"></i> : <i className="fa fa-times"></i> } Clean Only</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  @autobind
  _onFilter(key) {
    localStorage.setItem(key, !this.state[key]);
    this.setState({
      [key]: !this.state[key]
    });
    Song.noDataChange();
  }
}
