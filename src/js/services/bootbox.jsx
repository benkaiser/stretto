import * as React from 'react';
import autobind from 'autobind-decorator';
import { Modal, Button } from 'react-bootstrap';

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
      show: false,
      value: ''
    };
  }

  render() {
    const hasHeader = this.state.type === TYPES.PROMPT || this.state.type === TYPES.SHOW;
    return (
      <Modal show={this.state.show} onHide={this.onCancel}>
        { hasHeader &&
          <Modal.Header closeButton>
            <Modal.Title>{this.state.message}</Modal.Title>
          </Modal.Header>
        }
        <Modal.Body>
          { this.state.type === TYPES.PROMPT &&
            <input className='form-control' autoComplete='off' type='text' value={this.state.value} onChange={this.handleChange} /> }
          { this.state.type === TYPES.CONFIRM &&
            <p>{this.state.message}</p> }
          { this.state.type === TYPES.SHOW && this.state.contents }
        </Modal.Body>
        { this.state.type !== TYPES.SHOW &&
          <Modal.Footer>
            <Button variant='secondary' onClick={this.onCancel}>Cancel</Button>
            <Button variant='primary' onClick={this.onSuccess}>OK</Button>
          </Modal.Footer>
        }
      </Modal>
    );
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
        show: true,
        type: TYPES.CONFIRM,
        message: message,
        successCallback: resolve
      });
    })
  }

  prompt(message, options = {}) {
    return new Promise((resolve) => {
      this.setState({
        show: true,
        type: TYPES.PROMPT,
        message: message,
        successCallback: resolve,
        value: options.value || ''
      });
    });
  }

  show(header, contents) {
    this.setState({
      show: true,
      type: TYPES.SHOW,
      contents: contents,
      message: header
    });
  }

  reset() {
    this.setState({
      show: false,
      message: undefined,
      value: ''
    });
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
