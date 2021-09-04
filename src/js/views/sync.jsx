import * as React from 'react';
import AccountManager from '../services/account_manager';
import autobind from 'autobind-decorator';

export default class Import extends React.Component {
  constructor() {
    super();
    this.state = {
      strettoSignedIn: AccountManager.loggedInStretto
    };
    this._googleInitialized = false;
    this._emailRef = React.createRef();
    this._passwordRef = React.createRef();
    this._unsubscribe = AccountManager.addListener(this.onSignIn.bind(this));
  }

  render() {
    return (
      <div className='sync'>
        <h1>Stretto Account</h1>
        { !this.state.strettoSignedIn ?
          <div className='form-horizontal'>
            <p>A Stretto account is useful for syncing your music library between devices.</p>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Email</label>
              <div className='col-sm-10 col-md-3'>
                <input type='text' id='email' ref={this._emailRef} className='form-control' placeholder='john@doe.com' />
              </div>
            </div>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Password</label>
              <div className='col-sm-10 col-md-3'>
                <input type='password' id='password' ref={this._passwordRef} className='form-control' />
              </div>
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-2 col-sm-10 col-md-3'>
                { this.state.errorMessage && <div className='sync-info text-danger'>{ this.state.errorMessage }</div> }
                { this.state.infoMessage && <div className='sync-info text-info'>{ this.state.infoMessage }</div> }
                <button className='btn btn-primary' onClick={this.loginStretto}>Login</button>
                <button className='btn btn-link' onClick={this.createAccount}>Create Account</button>
                <button className='btn btn-link' onClick={this.forgotPassword}>Forgot Password</button>
              </div>
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-2 col-sm-10 col-md-3'>
                <p className='text-muted'>Note: To switch to a Stretto account from signing in with Google, enter your email and use the forgot password link</p>
              </div>
            </div>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Login with Google</label>
              <div className='col-sm-10'>
                <div ref={this.renderGoogleButton} id='google-signin-button'></div>
              </div>
            </div>
          </div>
          : <div><button className='btn btn-primary' onClick={this.logoutFromStretto}>Sign Out</button></div>
        }
      </div>
    );
  }

  componentDidMount() {
    AccountManager.initialise().then(() => {
      this._googleInitialized = true;
      if (!this.state.strettoSignedIn) {
        window.gapi.signin2.render('google-signin-button', {
          onSuccess: this.loginSuccess,
          onFailure: this.loginFailure
        });
      }
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  @autobind
  renderGoogleButton(ref) {
    if (this._googleInitialized && ref) {
      window.gapi.signin2.render('google-signin-button', {
        onSuccess: this.loginSuccess,
        onFailure: this.loginFailure
      });
    }
  }

  @autobind
  createAccount() {
    if (this._emailRef.current.value.length === 0) {
      this.setState({
        errorMessage: 'Please enter an email'
      });
      return;
    }
    if (this._passwordRef.current.value.length === 0) {
      this.setState({
        errorMessage: 'Please enter a password'
      });
      return;
    }
    this.setState({
      errorMessage: undefined,
      infoMessage: undefined
    });
    AccountManager.createAccount({ email: this._emailRef.current.value, password: this._passwordRef.current.value })
    .then(success => {
      this.setState({
        strettoSignedIn: true
      });
    })
    .catch(error => {
      this.setState({
        errorMessage: error.message
      });
    })
  }

  @autobind
  loginStretto() {
    if (this._emailRef.current.value.length === 0) {
      this.setState({
        errorMessage: 'Please enter an email'
      });
      return;
    }
    if (this._passwordRef.current.value.length === 0) {
      this.setState({
        errorMessage: 'Please enter a password'
      });
      return;
    }
    this.setState({
      errorMessage: undefined,
      infoMessage: undefined
    });
    AccountManager.login({ email: this._emailRef.current.value, password: this._passwordRef.current.value })
    .then(success => {
      this.setState({
        strettoSignedIn: true
      });
    })
    .catch(error => {
      this.setState({
        errorMessage: error.message
      });
    })
  }

  @autobind
  forgotPassword() {
    if (this._emailRef.current.value.length === 0) {
      this.setState({
        errorMessage: 'Please enter an email'
      });
      return;
    }
    this.setState({
      errorMessage: undefined,
      infoMessage: undefined
    });
    AccountManager.forgotPassword(this._emailRef.current.value)
    .then(() => {
      this.setState({
        infoMessage: 'If an account exists for that email, a reset email has been sent.'
      });
    });
  }

  @autobind
  loginSuccess(user) {
    AccountManager.setUser(user);
    this.setState({
      googleSignedIn: true
    });
  }

  @autobind
  loginFailure() {
    console.log('Failed to log in');
  }

  logoutFromGoogle() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      auth2.disconnect();
    });
  }

  @autobind
  logoutFromStretto() {
    if (this.state.googleSignedIn) {
      this.logoutFromGoogle();
    }
    AccountManager.logoutFromStretto()
    .then(() => {
      this.setState({
        strettoSignedIn: false
      });
    })
  }

  onSignIn() {
    this.setState({
      strettoSignedIn: AccountManager.loggedInStretto
    });
  }
}
