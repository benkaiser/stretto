import * as React from 'react';

import Utilities from "../utilities";

export default class DesktopOnly extends React.Component {
  constructor(props) {
    super(props);
    this.onResize = Utilities.debounce(this.onResize.bind(this));
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  render() {
    this._lastMobileStatus = Utilities.isMobile();
    if (this._lastMobileStatus) {
      return null;
    } else {
      return this.props.children;
    }
  }

  onResize() {
    if (this._lastMobileStatus !== Utilities.isMobile()) {
      this.forceUpdate();
    }
  }
}