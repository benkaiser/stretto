import * as React from 'react';
import PlayerControls from './player_controls';
import PlayerInfoMobile from './player_info_mobile';

export default class MobileFooter extends React.Component {
  render() {
    const isPlayer = window.location.pathname === '/player';
    return <div className={'mobileFooter modal-content' + (isPlayer ? ' footerHidden' : '')}>
      <PlayerControls />
      <PlayerInfoMobile />
    </div>;
  }
}