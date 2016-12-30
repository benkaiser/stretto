import { h, Component } from 'preact';
import Theme from '../theme.js';

class ThemeSwitcher extends Component {
  render() {
    return (
      <div class='form-inline'>
        Theme: <select class='form-control input-sm' onChange={this.loadTheme.bind(this)}>
        {Theme.themes().map((theme) =>
          <option value={theme}>{theme}</option>
        )}
        </select>
      </div>
    );
  }

  loadTheme(event) {
    let newTheme = new Theme(event.target.value);
    newTheme.load();
  }
}

module.exports = ThemeSwitcher;
