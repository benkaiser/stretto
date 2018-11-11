import * as React from 'react';
import autobind from 'autobind-decorator';
import SocketManager from '../services/socket_manager';

export default class LoggedInRemote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: true
    };
  }

  componentDidMount() {
    SocketManager.sendPlayPause();
  }

  render() {
    if (this.state.loading) {
      return <div>Finding client to control...</div>;
    } else {

    }
    return (
      <div className='remote-control-buttons'>
        <div><i className='fa fa-2x fa-fast-backward' aria-hidden='true' onClick={this._previous}></i></div>
        { (this.state.playing) ?
          <div><i className='fa fa-2x fa-pause' aria-hidden='true' onClick={this._togglePlaying}></i></div>
          :
          <div><i className='fa fa-2x fa-play' aria-hidden='true' onClick={this._togglePlaying}></i></div>
        }
        <div><i className='fa fa-2x fa-fast-forward' aria-hidden='true' onClick={this._next}></i></div>
      </div>
    );
  }

  @autobind
  _previous() {
    SocketManager.sendPrevious();
  }

  @autobind
  _next() {
    SocketManager.sendNext();
  }

  @autobind
  _togglePlaying() {
    SocketManager.sendPlayPause();
  }
}