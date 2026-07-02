import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import CountrySwitcher from './countryswitcher';
import GlobalVolume from './global_volume';
import ThemeSwitcher from './themeswitcher';
import PublicLibraryJsonSetting from './public_library_json_setting';
import AccountManager from '../services/account_manager';

export default class Intro extends React.Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div className='form-horizontal'>
          <ThemeSwitcher />
          <CountrySwitcher />
          <GlobalVolume />
          { AccountManager.loggedInStretto && <PublicLibraryJsonSetting /> }
          <div className='form-group row'>
            <div className='col-sm-10 offset-sm-2'>
              <Link to='/explicitscan/'><Button variant='primary'>Scan Library for Explicit Tracks</Button></Link>
            </div>
          </div>
          <div className='form-group row'>
            <div className='col-sm-10 offset-sm-2'>
              <Link to='/backup/'><Button variant='primary'>Backup and Restore data</Button></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}