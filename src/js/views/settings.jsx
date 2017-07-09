import { h, Component } from 'preact';
import ThemeSwitcher from './themeswitcher';

class Intro extends Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div class='form-horizontal'>
          <ThemeSwitcher />
        </div>
      </div>
    );
  }
}

module.exports = Intro;
