import * as React from 'react';
import ThemeSwitcher from './themeswitcher';

class Intro extends React.Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div className='form-horizontal'>
          <ThemeSwitcher />
        </div>
      </div>
    );
  }
}

module.exports = Intro;
