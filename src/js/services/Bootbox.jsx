import { Component, h, render, rerender } from 'preact';
import autobind from 'autobind-decorator';

export default class Bootbox extends Component {
  constructor() {
    super();
    Bootbox._component = this;
    this.state = {
      value: '',
      visible: false
    };
  }

  render() {
    const visibleClass = this.state.visible ? 'in visibleModal' : '';
    return (
      <div>
        <div class={`modal fade ${visibleClass}`} tabindex='-1' role='dialog' aria-hidden='true'>
          <div class='modal-dialog'>
            <div class='modal-content'>
              { this.state.message &&
                <div class="modal-header">
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                  <h4 class="modal-title">{this.state.message}</h4>
                </div> }
              <div class='modal-body'>
                <input class='form-control' autocomplete='off' type='text' value={this.state.value} onChange={this.handleChange}  />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default" onclick={this.onCancel}>Cancel</button>
                <button type="button" class="btn btn-primary" onclick={this.onSuccess}>OK</button>
              </div>
            </div>
          </div>
        </div>
        { this.state.visible && <div class="modal-backdrop fade in"></div> }
      </div>
    );
  }

  @autobind
  handleChange(event) {
    this.setState({
      value: event.target.value
    })
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

  prompt(message) {
    return new Promise((resolve) => {
      this.setState({
        message: message,
        successCallback: resolve,
        visible: true
      });
    });
  }

  reset() {
    this.setState({
      message: undefined,
      value: '',
      visible: false
    })
  }

  static prompt(message) {
    return Bootbox._component.prompt(message);
  }
}
