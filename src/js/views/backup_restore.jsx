import * as React from 'react';
import Exporter from '../services/exporter';
import Importer from '../services/importer';
import { Button } from 'react-bootstrap';
import autobind from 'autobind-decorator';

export default class BackupRestore extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className='import'>
        <h1>Backup and Restore</h1>
        <p>
          Use this feature to download your raw song and playlist data. It can then be re-imported here also.<br/>
          You may find this useful if you need to move your data between accounts or export it into an editable form to import into other music players.<br/>
          <Button bsStyle='primary' style={({marginTop: '10px'})} onClick={this._export}>Download your data</Button><br/>
          <label className='btn btn-primary' style={({marginTop: '10px'})} htmlFor='file'>Import Data</label>
          <input id='file' style={{ visibility: 'hidden' }} type='file' onChange={this._import} />
        </p>
        { this.state.error &&
          <p className='text-danger'>{this.state.error}</p>
        }
        { this.state.message &&
          <p>{this.state.message}</p>
        }
      </div>
    );
  }

  @autobind
  _export() {
    this.setState({
      error: undefined,
      message: 'exporting...'
    });
    try {
      new Exporter();
      this.setState({
        message: 'export started'
      });
    } catch (error) {
      console.log(error);
      this.setState({
        error: 'Unable to export.',
        message: ''
      });
    }
  }

  @autobind
  _import(event) {
    this.setState({
      error: undefined,
      message: 'importing...'
    });
    try {
      const importer = new Importer();
      importer.start(event).then(() => {
        this.setState({
          message: 'import completed'
        });
      });
    } catch (error) {
      console.log(error);
      this.setState({
        error: 'Unable to import.',
        message: ''
      });
    }
  }
}
