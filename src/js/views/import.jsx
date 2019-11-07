import * as React from 'react';
import Importer from '../services/importer';
import autobind from 'autobind-decorator';

export default class Import extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className='import'>
        <h1>Import Library from Stretto 1.x</h1>
        <form>
          <div className='form-group'>
            <label htmlFor='importdata'>Paste the import JSON here</label>
            <textarea
              className='form-control'
              ref={(input) => { this.input = input; }}
              type='text'
              name='importdata'
            />
          </div>
          <div className='form-group'>
            <div className='btn btn-default' onClick={this._import}>
              Import
            </div>
          </div>
        </form>
        { this.state.error &&
          <p className='text-danger'>{this.state.error}</p>
        }
        { this.state.progressFraction !== undefined &&
          <div className='progress'>
            <div
              className='progress-bar'
              role='progressbar'
              aria-valuenow={this.state.progressFraction}
              aria-valuemin='0'
              aria-valuemax='1'
              style={{'width': `${this.state.progressFraction * 100}%`}}
            >
              <span className='sr-only'>{this.state.progressFraction}% Complete</span>
            </div>
          </div>
        }
        { this.state.message &&
          <p>{this.state.message}</p>
        }
      </div>
    );
  }

  @autobind
  _import() {
    this.setState({
      error: undefined
    });
    try {
      let importData = JSON.parse(this.input.value);
      this.importer = new Importer({
        data: importData,
        progressCallback: this._onProgress
      });
      this.importer.start();
      this.input.value = '';
    } catch (error) {
      console.log(error);
      this.setState({
        error: 'Input is not valid JSON.'
      });
    }
  }

  @autobind
  _onProgress(progressFraction, message) {
    this.setState({
      message: message,
      progressFraction: progressFraction
    });
  }
}
