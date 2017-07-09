import { h, Component } from 'preact';
import AccountManager from '../services/account_manager';
import Importer from '../services/importer';
import autobind from 'autobind-decorator';

class Import extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div class='sync'>
        <h1>Sync Status</h1>
        <div class='form-horizontal'>
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
    window.gapi.signin2 && window.gapi.signin2.render('google-signin-button', {
      onSuccess: this.loginSuccess,
      onFailure: this.loginFailure
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
