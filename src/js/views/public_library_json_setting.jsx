import autobind from 'autobind-decorator';
import * as React from 'react';
import AccountManager from '../services/account_manager';

export default class PublicLibraryJsonSetting extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
  }

  componentDidMount() {
    this._fetchData();
  }

  render() {
    return (
      <div className='form-group'>
        <label className='col-sm-2 control-label'>Public JSON Library</label>
        <div className='col-sm-10'>
          <input type='checkbox' checked={this.state.isPublicJsonLibrary} onChange={this.setPublicJsonLibrary} />
          { this.state.isPublicJsonLibrary
            ? <span className='help-block'>Your library is available publicly at <a href={this.state.libraryUrl} target='_blank'>{this.state.libraryUrl}</a></span>
            : <span className='help-block'>Make your library available at a public URL, useful for Android Auto or other integrations.</span> }
        </div>
      </div>
    );
  }

  _fetchData() {
    AccountManager.getPublicJsonLibrary().then(response => {
      this.setState({
        loading: false,
        isPublicJsonLibrary: response.publicJsonLibrary,
        libraryUrl: response.libraryUrl
      });
    });
  }

  @autobind
  setPublicJsonLibrary() {
    AccountManager.setPublicJsonLibrary(!this.state.isPublicJsonLibrary).then(isPublicJsonLibrary => {
      this.setState({
        isPublicJsonLibrary: isPublicJsonLibrary
      });
    });
  }
}