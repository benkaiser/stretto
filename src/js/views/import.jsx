import { h, Component } from 'preact';
import Importer from '../services/importer';
import autobind from 'autobind-decorator';

class Import extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div class='import'>
        <h1>Import Library</h1>
        <form>
          <div class="form-group">
            <label for="importdata">Import JSON</label>
            <textarea
              class='form-control'
              ref={(input) => { this.input = input; }}
              type='text'
              name='importdata'
            />
          </div>
          <div class="form-group">
            <div class='btn btn-default' onClick={this._import}>
              Import
            </div>
          </div>
        </form>
        { this.state.error &&
          <p class='text-danger'>{this.state.error}</p>
        }
        { this.state.progressFraction !== undefined &&
          <div class="progress">
            <div
              class="progress-bar"
              role="progressbar"
              aria-valuenow={this.state.progressFraction}
              aria-valuemin="0"
              aria-valuemax="1"
              style={`width: ${this.state.progressFraction * 100}%;`}
            >
              <span class="sr-only">60% Complete</span>
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

module.exports = Import;
