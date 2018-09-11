import * as React from 'react';
import autobind from 'autobind-decorator';
import bsn from 'bootstrap.native';

const TYPES = {
  CONFIRM: 1,
  PROMPT: 2
}

export default class Bootbox extends React.Component {
  constructor() {
    super();
    Bootbox._component = this;
    this.state = {
      value: ''
    };
  }

  render() {
    const closeBtn = (
      <button
        aria-label='Close'
        className='close'
        onClick={this.onCancel}
        type='button'>
        <span aria-hidden='true'>&times;</span>
      </button>
    );

    return (
      <div className='modal fade' ref={(modal) => this.modal = modal} tabIndex='-1' role='dialog' aria-hidden='true'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            { this.state.type === TYPES.PROMPT &&
              <div className='modal-header'>
                { closeBtn }
                <h4 className='modal-title'>{this.state.message}</h4>
              </div>
            }
            <div className='modal-body'>
              { this.state.type === TYPES.CONFIRM  && closeBtn }
              { this.state.type === TYPES.PROMPT &&
                <input className='form-control' autoComplete='off' type='text' value={this.state.value} onChange={this.handleChange}  /> }
              { this.state.type === TYPES.CONFIRM &&
                <p>{this.state.message}</p> }
            </div>
            <div className='modal-footer'>
              <button type='button' className='btn btn-default' onClick={this.onCancel}>Cancel</button>
              <button type='button' className='btn btn-primary' onClick={this.onSuccess}>OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.bsModal = new bsn.Modal(this.modal);
  }

  @autobind
  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  @autobind
  onCancel() {
    this.reset();
  }

  @autobind
  onSuccess() {
    if (this.state.successCallback) {
      this.state.successCallback(this.state.value);
    }
    this.reset();
  }

  confirm(message) {
    return new Promise((resolve) => {
      this.setState({
        type: TYPES.CONFIRM,
        message: message,
        successCallback: resolve
      });
      this.bsModal.show();
    })
  }

  prompt(message, options = {}) {
    return new Promise((resolve) => {
      this.setState({
        type: TYPES.PROMPT,
        message: message,
        successCallback: resolve,
        value: options.value || ''
      });
      this.bsModal.show();
    });
  }

  reset() {
    this.setState({
      message: undefined,
      value: ''
    });
    this.bsModal.hide();
  }

  static confirm(message) {
    return Bootbox._component.confirm(message);
  }

  static prompt(message, options) {
    return Bootbox._component.prompt(message);
  }
}
