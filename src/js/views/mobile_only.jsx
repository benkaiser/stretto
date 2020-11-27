import * as React from 'react';

import Utilities from "../utilities";

export default class MobileOnly extends React.Component {
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
      return this.props.children;
    } else {
      return null;
    }
  }

  onResize() {
    if (this._lastMobileStatus !== Utilities.isMobile()) {
      this.forceUpdate();
    }
  }
}