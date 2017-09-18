import { h, Component } from 'preact';
import Sidebar from './sidebar';
import Alerter from '../services/alerter';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';

class Layout extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class='root'>
        <Sidebar />
        <div class="content">
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
