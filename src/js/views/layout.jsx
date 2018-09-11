import * as React from 'react';
import Sidebar from './sidebar';
import Alerter from '../services/alerter';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';

class Layout extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='root'>
        <Sidebar />
        <div className='content'>
          {this.props.children}
        </div>
        <Bootbox />
        <Alerter />
        <ContextMenu />
      </div>
    );
  }
}

module.exports = Layout;
