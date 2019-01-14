import autobind from 'autobind-decorator';
import * as React from 'react';
import Country from '../country';

export default class CountrySwitcher extends React.Component {
  render() {
    const countries = Country.countries();
    return (
      <div className='form-group'>
        <label className='col-sm-2 control-label' title='used for showing top charts and search'>Country</label>
        <div className='col-sm-10'>
          <select className='form-control input-sm' onChange={this.changeLanguage} defaultValue={Country.current()}>
          {Object.keys(countries).map(country =>
            <option key={country} value={country}>{countries[country]}</option>
          )}
          </select>
        </div>
      </div>
    );
  }

  @autobind
  changeLanguage(event) {
    Country.setCountry(event.target.value);
  }
}