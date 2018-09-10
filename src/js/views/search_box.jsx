import { h, Component } from 'preact';
import {
  Form,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup
} from 'react-bootstrap';
import { withRouter } from 'react-router'
import autobind from 'autobind-decorator';

const SEARCH_DELAY = 300;

class SearchBox extends Component {
  constructor() {
    super();
    this.state = {
      value: ''
    };
  }

  render() {
    return (
      <div class="searchContainer">
        <InputGroup class="searchBox" bsSize="sm">
          <InputGroup.Addon><Glyphicon glyph="search" /></InputGroup.Addon>
          <FormControl
            type="text"
            value={this.state.value}
            placeholder="Search"
            onChange={this._handleChange} />
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
    this.props.router.push(`/search/${this.state.value}`);
  }
}

module.exports = withRouter(SearchBox);
