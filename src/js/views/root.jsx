import { h, render } from 'preact';
import ThemeSwitcher from './themeswitcher';

class RootViewLoader {
  static initialise() {
    render((
        <div>
            <ThemeSwitcher />
        </div>
    ), document.getElementById('content'));
  }
}

module.exports = RootViewLoader;
