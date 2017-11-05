import { h, Component } from 'preact';
import SoundcloudConnector from './soundcloud_connector';
import ThemeSwitcher from './themeswitcher';

class Intro extends Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div class='form-horizontal'>
          <ThemeSwitcher />
          <SoundcloudConnector />
        </div>
      </div>
    );
  }
}

module.exports = Intro;
