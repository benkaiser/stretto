import * as React from 'react';
import Theme from '../theme';

export default class ThemeSwitcher extends React.Component {
  render() {
    return (
      <div className='form-group'>
        <label className='col-sm-2 control-label'>Theme</label>
        <div className='col-sm-10'>
          <select className='form-control input-sm' onChange={this.loadTheme.bind(this)} defaultValue={Theme.currentTheme()}>
          {Theme.themes().map((theme) =>
            <option key={theme} value={theme}>{theme}</option>
          )}
          </select>
        </div>
      </div>
    );
  }

  loadTheme(event) {
    let newTheme = new Theme(event.target.value);
    newTheme.load();
  }
}