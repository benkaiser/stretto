import * as React from 'react';
import SocketManager from '../services/socket_manager';

export default class LoggedInRemote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
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
  }
}