import AlertContainer from 'react-alert';
import * as React from 'react';

const ALERT_OPTIONS = {
  offset: 30,
  position: 'top right',
  theme: 'dark',
  time: 5000,
  transition: 'fade'
}

export default class Alerter extends React.Component {
  static error(message) {
    return Alerter._component.alert(message, 'error');
  }

  static info(message) {
    return Alerter._component.alert(message, 'info');
  }

  static success(message) {
    return Alerter._component.alert(message, 'success');
  }

  constructor() {
    super();
    Alerter._component = this;
    this.state = {
      value: ''
    };
  }

  render() {
    return (
      <AlertContainer ref={alert => this._alertRef = alert} {...ALERT_OPTIONS} />
    );
  }

  alert(message, type) {
    this._alertRef.show(message, {
      type: type
    });
  }
}
