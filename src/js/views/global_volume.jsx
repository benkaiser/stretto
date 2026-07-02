import * as React from 'react';
import VolumeSlider from './volume_slider';

export default class CountrySwitcher extends React.Component {
  render() {
    return (
      <div className='form-group row'>
        <label className='col-sm-2 col-form-label' title='used for showing top charts and search'>App Volume</label>
        <div className='col-sm-2'>
          <VolumeSlider />
        </div>
      </div>
    );
  }
}