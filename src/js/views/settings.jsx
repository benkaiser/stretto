import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CountrySwitcher from './countryswitcher';
import ThemeSwitcher from './themeswitcher';

export default class Intro extends React.Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div className='form-horizontal'>
          <ThemeSwitcher />
          <CountrySwitcher />
          <div className='form-group'>
            <div className='col-sm-10 col-sm-offset-2'>
            <Link to='/import/'><Button bsStyle='primary'>Import from Stretto 1.x</Button></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}