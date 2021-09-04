import * as React from 'react';
import AccountManager from '../services/account_manager';
import autobind from 'autobind-decorator';
import { Link } from 'react-router-dom';

export default class Import extends React.Component {
  constructor() {
    super();
    this.state = {};
    this._emailRef = React.createRef();
    this._passwordRef = React.createRef();
  }

  render() {
    return (
      <div className='sync'>
        <h1>Password Reset</h1>
        { !this.state.resetCompleted ?
          <div className='form-horizontal'>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>Confirm Email</label>
              <div className='col-sm-10 col-md-3'>
                <input type='text' id='email' ref={this._emailRef} className='form-control' placeholder='john@doe.com' />
              </div>
            </div>
            <div className='form-group'>
              <label className='col-sm-2 control-label'>New Password</label>
              <div className='col-sm-10 col-md-3'>
                <input type='password' id='password' ref={this._passwordRef} className='form-control' />
              </div>
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-2 col-sm-10 col-md-3'>
                <button className='btn btn-primary' onClick={this.resetPassword}>Reset Password</button>
              </div>
            </div>
          </div>
          : <div>Your password has been reset. You can now sign in again. <Link to='/sync' className='btn btn-primary'>Login</Link></div>
        }
      </div>
    );
  }

  @autobind
  resetPassword() {
    const resetToken = new URL(window.location.href).searchParams.get('token');
    AccountManager.completeReset(this._emailRef.current.value, this._passwordRef.current.value, resetToken)
    .then(_ => {
      this.setState({
        resetCompleted: true
      });
    });
  }
}
