import { Component, h, render, rerender } from 'preact';
import autobind from 'autobind-decorator';
import bsn from 'bootstrap.native';

const TYPES = {
  CONFIRM: 1,
  PROMPT: 2
}

export default class Bootbox extends Component {
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
        class='close'
        onclick={this.onCancel}
        type='button'>
        <span aria-hidden='true'>&times;</span>
      </button>
    );

    return (
      <div class='modal fade' ref={(modal) => this.modal = modal} tabindex='-1' role='dialog' aria-hidden='true'>
        <div class='modal-dialog'>
          <div class='modal-content'>
            { this.state.type === TYPES.PROMPT &&
              <div class='modal-header'>
                { closeBtn }
                <h4 class='modal-title'>{this.state.message}</h4>
              </div>
            }
            <div class='modal-body'>
              { this.state.type === TYPES.CONFIRM  && closeBtn }
              { this.state.type === TYPES.PROMPT &&
                <input class='form-control' autocomplete='off' type='text' value={this.state.value} onChange={this.handleChange}  /> }
              { this.state.type === TYPES.CONFIRM &&
                <p>{this.state.message}</p> }
            </div>
            <div class='modal-footer'>
              <button type='button' class='btn btn-default' onclick={this.onCancel}>Cancel</button>
              <button type='button' class='btn btn-primary' onclick={this.onSuccess}>OK</button>
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
