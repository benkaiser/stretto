import * as React from 'react';
import autobind from 'autobind-decorator';
import { Checkbox } from 'react-bootstrap';

export default class Offline_Mode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: localStorage.getItem('offlineOnly') === 'true'
    };
  }

  render() {
    return (
      <div className='form-group'>
        <label className='col-sm-2 control-label' title='Only show songs availabel offline'>Offline Only in Playlists</label>
        <div className='col-sm-10'>
          <Checkbox checked={ this.state.checked } onClick={this.changeOfflineMode} />
        </div>
      </div>
    );
  }

  @autobind
  changeOfflineMode() {
    localStorage.setItem('offlineOnly', !this.state.checked);
    this.setState({
      checked: !this.state.checked
    })
  }
}