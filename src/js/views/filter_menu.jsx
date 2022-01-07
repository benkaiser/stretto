import * as React from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';
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
      <Dropdown title='Filter' className='pull-right' id={this.props.id} onSelect={this._onFilter}>
        <Dropdown.Toggle noCaret={this.props.navbar} bsStyle='link' className={this.props.navbar ? 'navbar-toggle' : ''}>
          <i className="fa fa-filter"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <MenuItem eventKey="offlineOnly">{ this.state.offlineOnly ? <i className="fa fa-check"></i> : <i className="fa fa-times"></i> } Offline Only</MenuItem>
          <MenuItem eventKey="cleanOnly">{ this.state.cleanOnly ? <i className="fa fa-check"></i> : <i className="fa fa-times"></i> } Clean Only</MenuItem>
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