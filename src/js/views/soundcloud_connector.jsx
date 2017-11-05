import { h, Component } from 'preact';
import { Button } from 'react-bootstrap';
import Soundcloud from 'soundcloud';

export default class SoundcloudConnector extends Component {
  render() {
    return (
      <div class='form-group'>
        <label class='col-sm-2 control-label'></label>
        <div class='col-sm-10'>
          <Button onClick={this.connect}>Connect to Soundcloud</Button>
        </div>
      </div>
    );
  }

  connect() {
    // ID and redirect uri stolen from another github project because
    // soundcloud closed registrations but I still want to keep testing out
    // oauth against localhost
    // stolen from https://github.com/mddengo/purify
    Soundcloud.initialize({
      client_id: 'eee3748e069929800832551465ce60f5',
      redirect_uri: 'http://localhost:3000/callback'
    });
    Soundcloud.connect().then((data) => {
      return Soundcloud.get('/me/activities/tracks/affiliated', { limit: 20 });
    }).then((me) => {
      console.log(me);
    }).catch(function(error){
      alert('Error: ' + error.message);
    });
  }
}
