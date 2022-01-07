import * as React from 'react';
import { Button, ProgressBar } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import Song from '../models/song';
import ExplicitScanner from '../services/explicit_scanner';

export default class ExplicitScan extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      started: ExplicitScanner.instance.inProgress(),
    };
  }

  componentDidMount() {
    ExplicitScanner.instance.addEventListener('message', this._onEvent);
  }

  componentWillUnmount() {
    ExplicitScanner.instance.removeEventListener('message', this._onEvent);
  }

  render() {
    return (
      <div className='import'>
        <h1>Scan for Explicit Tracks</h1>
        <p>
          Use this page to do a full scan of your library and automatically mark any tracks as explicit.<br/>
          { !this.state.started &&
            <Button bsStyle='primary' style={({marginTop: '10px'})} onClick={this._startScan}>Run Scan</Button>
          }
        </p>
        { ExplicitScanner.instance.inProgress() && <p>
          <ProgressBar now={ExplicitScanner.instance.progress()} label={`${ExplicitScanner.instance.progress().toFixed(0)}%`} />
        </p> }
        { this.state.error &&
          <p className='text-danger'>{this.state.error}</p>
        }
        { this.state.message &&
          <p>{this.state.message}</p>
        }
      </div>
    );
  }

  _startScan() {
    ExplicitScanner.instance.start(Song.fetchAll());
  }

  @autobind
  _onEvent(event) {
    this.setState({
      message: event.message
    });
  }
}
