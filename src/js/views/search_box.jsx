import * as React from 'react';
import {
  Form,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom'
import autobind from 'autobind-decorator';

const SEARCH_DELAY = 300;

class SearchBox extends React.Component {
  constructor() {
    super();
    this.state = {
      value: ''
    };
  }

  componentWillReceiveProps(props) {
    this._updateSearch(props);
  }

  componentDidMount() {
    this._updateSearch(this.props);
  }

  render() {
    return (
      <div className='searchContainer'>
        <InputGroup className='searchBox' bsSize='sm'>
          <InputGroup.Addon><Glyphicon glyph='search' /></InputGroup.Addon>
          <FormControl
            type='text'
            value={this.state.value}
            placeholder='Search'
            onChange={this._handleChange}
            inputRef={(ref) => this._inputRef = ref } />
        </InputGroup>
      </div>
    );
  }

  @autobind
  _handleChange(event) {
    this.setState({ value: event.target.value });
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(this._executeSearch, SEARCH_DELAY);
  }

  @autobind
  _executeSearch() {
    if (this.state.value.length < 3) {
      return false;
    }
    const newUrl = `/search/${this.state.value}`;
    this.props.history.location.pathname.indexOf('/search/') == 0 ?
      this.props.history.replace(newUrl) :
      this.props.history.push(newUrl);
  }

  _getSearchTerm(props) {
    return props.location.pathname.indexOf('/search/') === 0 && decodeURIComponent(props.location.pathname.replace('/search/',''));
  }

  _updateSearch(props) {
    const searchTerm = this._getSearchTerm(props);
    if (this._inputRef && this._inputRef !== document.activeElement && searchTerm) {
      this.setState({
        value: searchTerm || ''
      });
    }
  }
}

export default withRouter(SearchBox);
