import { h, Component } from 'preact';
import ThemeSwitcher from './themeswitcher';

class Intro extends Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <ThemeSwitcher />
      </div>
    );
  }
}

module.exports = Intro;
