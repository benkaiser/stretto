import { Provider, withAlert } from 'react-alert';
import * as React from 'react';

const ALERT_OPTIONS = {
  offset: '10px',
  position: 'top right',
  timeout: 5000,
  transition: 'scale',
  zIndex: 100000,
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
    return null;
  }

  alert(message, type) {
    this.props.alert.show(message, {
      type: type
    });
  }
}

class AlertTemplate extends React.Component {
  render() {
    let { style, options, message, close } = this.props;
    if (style) {
      style = {
        ...style,
        marginRight: '25px'
      };
    }
    let type = options.type;
    type == 'error' && (type = 'danger');
    return (
      <div style={style} className={'alert alerter-alert alert-dismissable alert-' + type}>
        <button type="button" className="close" data-dismiss="alert" onClick={close}>×</button>
        {message}
      </div>
    );
  }
}

const AlerterWithAlert = withAlert(Alerter);

export class AlerterContainer extends React.Component {
  render() {
    return (
      <Provider template={AlertTemplate} {...ALERT_OPTIONS}>
        <AlerterWithAlert />
      </Provider>
    )
  }
}