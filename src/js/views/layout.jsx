import * as React from 'react';
import Sidebar from './sidebar';
import { AlerterContainer } from '../services/alerter';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';
import DesktopOnly from './desktop_only';
import MobileOnly from './mobile_only';
import MobileHeader from './mobile_header';
import MobileFooter from './mobile_footer';

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const isPlayer = window.location.pathname === '/player';
    return (
      <div className='root'>
        <DesktopOnly><Sidebar /></DesktopOnly>
        <MobileOnly><MobileHeader /></MobileOnly>
        <div className={'content' + (isPlayer ? ' fullbleed' : '') }>
          {this.props.children}
        </div>
        <MobileOnly><MobileFooter /></MobileOnly>
        <Bootbox />
        <AlerterContainer />
        <ContextMenu />
      </div>
    );
  }
}
