import { h, Component } from 'preact';
import Theme from '../theme.js';

class ThemeSwitcher {
  render() {
    return (
      <div>
        {Theme.themes().map((theme) =>
          <p>
            <div class='btn btn-default'
                 onClick={this.loadTheme.bind(this, theme)} >
              {theme}
            </div>
          </p>
        )}
      </div>
    );
  }

  loadTheme(theme) {
    let newTheme = new Theme(theme);
    newTheme.load();
  }
}

module.exports = ThemeSwitcher;
