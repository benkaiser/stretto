import autobind from 'autobind-decorator';
import * as React from 'react';
import ItunesCountry from '../itunes_country';

export default class CountrySwitcher extends React.Component {
  render() {
    const countries = ItunesCountry.countries();
    return (
      <div className='form-group'>
        <label className='col-sm-2 control-label' title='used for showing top charts and search'>iTunes Country Code</label>
        <div className='col-sm-10'>
          <select className='form-control input-sm' onChange={this.changeLanguage}>
          {Object.keys(countries).map(country =>
            <option key={country} value={country} selected={country === ItunesCountry.current()}>{countries[country]}</option>
          )}
          </select>
        </div>
      </div>
    );
  }

  @autobind
  changeLanguage(event) {
    ItunesCountry.setCountry(event.target.value);
  }
}