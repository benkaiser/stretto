import * as React from 'react';
import autobind from 'autobind-decorator';
import bsn from 'bootstrap.native';

const TYPES = {
  CONFIRM: 1,
  PROMPT: 2,
  SHOW: 3
}

let loadedResolve;
const loadingPromise = new Promise(resolve => loadedResolve = resolve);

export default class Bootbox extends React.Component {
  constructor() {
    super();
    Bootbox._component = this;
    loadedResolve();
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
            { (this.state.type === TYPES.PROMPT || this.state.type === TYPES.SHOW) &&
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
              { this.state.type === TYPES.SHOW && this.state.contents }
            </div>
            { this.state.type !== TYPES.SHOW &&
              <div className='modal-footer'>
                <button type='button' className='btn btn-default' onClick={this.onCancel}>Cancel</button>
                <button type='button' className='btn btn-primary' onClick={this.onSuccess}>OK</button>
              </div>
            }
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
    setTimeout(() => {
      this.reset();
    });
  }

  @autobind
  onSuccess() {
    if (this.state.successCallback) {
      this.state.successCallback(this.state.value);
    }
    setTimeout(() => {
      this.reset();
    });
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

  show(header, contents) {
    this.setState({
      type: TYPES.SHOW,
      contents: contents,
      message: header
    });
    this.bsModal.show();
  }

  reset() {
    this.setState({
      message: undefined,
      value: ''
    });
    this.bsModal.hide();
  }

  static confirm(message) {
    return loadingPromise.then(() => Bootbox._component.confirm(message));
  }

  static prompt(message, options) {
    return loadingPromise.then(() => Bootbox._component.prompt(message, options));
  }

  static show(header, contents) {
    loadingPromise.then(() => {
      Bootbox._component.show(header, contents);
    });
  }
}
