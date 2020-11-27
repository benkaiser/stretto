import * as React from 'react';
import PlayerControls from './player_controls';

export default class MobileFooter extends React.Component {
  render() {
    return <div className='mobileFooter modal-content'><PlayerControls /></div>;
  }
}