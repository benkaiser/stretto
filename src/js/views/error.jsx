import * as React from 'react';
import { Alert } from 'react-bootstrap';

export default class Intro extends React.Component {
  render() {
    console.log(this.props.location.state);
    const message = this.props.location && this.props.location.state && this.props.location.state.error && this.props.location.state.error.message
    return (
      <div className='intro'>
        <Alert bsStyle='danger'>
          <strong>Oh no!</strong> We hit an error: {message}
        </Alert>
      </div>
    );
  }
}