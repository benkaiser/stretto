import * as React from 'react';
import AccountManager from '../services/account_manager';
import autobind from 'autobind-decorator';

class Import extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className='sync'>
        <h1>Sync Status</h1>
        <div className='form-horizontal'>
          <div className='form-group'>
            <label className='col-sm-2 control-label'>Connect to Sync</label>
            <div className='col-sm-10'>
              <div id='google-signin-button'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    AccountManager.initialise().then(() => {
      window.gapi.signin2.render('google-signin-button', {
        onSuccess: this.loginSuccess,
        onFailure: this.loginFailure
      });
    });
  }

  @autobind
  loginSuccess(user) {
    AccountManager.setUser(user);
  }

  @autobind
  loginFailure() {
    console.log('Failed to log in');
  }
}

module.exports = Import;
