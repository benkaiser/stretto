import { h, Component } from 'preact';
import AccountManager from '../services/account_manager';
import Button from 'react-bootstrap/lib/Button';
import ThemeSwitcher from './themeswitcher';
import autobind from 'autobind-decorator';

class Intro extends Component {
  render() {
    return (
      <div>
        <h1>Settings</h1>
        <div class='form-horizontal'>
          <ThemeSwitcher />
          <div class='form-group'>
            <label class='col-sm-2 control-label'>Connect to Sync</label>
            <div class='col-sm-10'>
              <div id='google-signin-button'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    window.gapi.signin2.render('google-signin-button', {
      onSuccess: this.loginSuccess,
      onFailure: this.loginFailure
    });
  }

  @autobind
  loginSuccess(user) {
    AccountManager.setUser(user);
    console.log(AccountManager.user.getBasicProfile().getEmail());
  }
}

module.exports = Intro;
