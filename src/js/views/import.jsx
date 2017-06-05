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
    } catch (error) {
      console.log(error);
      this.setState({
        error: 'Input is not valid JSON.'
      });
    }
  }
}

module.exports = Import;
