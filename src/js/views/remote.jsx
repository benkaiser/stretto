import * as React from 'react';
import Spinner from 'react-spinkit';
import autobind from 'autobind-decorator';

import AccountManager from '../services/account_manager';
import LoggedInRemote from './logged_in_remote';

export default class Remote extends React.Component {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
      loading: false
    };
  }

  componentDidMount() {
    AccountManager.initialise().then(() => {
      if (AccountManager.loggedInGoogle === false) {
        window.gapi.signin2.render('google-signin-button', {
          onSuccess: this.loginSuccess,
          onFailure: this.loginFailure
        });
      }
    });
    AccountManager.addListener(() => {
      if (AccountManager.loadedData) {
        return this.setState({
          loading: false
        });
      }
      if (!this.state.loggedIn && AccountManager.loggedInGoogle) {
        return this.setState({
          loggedIn: true,
          loading: true
        });
      }
    });
  }

  render() {
    if (this.state.loading) {
      return this._spinner();
    }
    if (!this.state.loggedIn) {
      return this._login();
    }

    return <LoggedInRemote />;
  }

  _login() {
    return <div key='google-parent'><div id='google-signin-button'></div></div>;
  }

  _spinner() {
    return <div><Spinner name='line-scale' /></div>;
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