import { h, Component } from 'preact';
import Sidebar from './sidebar';

class Layout extends Component {
  render() {
    return (
      <div class='root'>
        <Sidebar />
        <div class="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

module.exports = Layout;
