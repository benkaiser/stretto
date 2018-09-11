import { render } from 'react-dom';
import * as React from 'react';
import { browserHistory, Switch, Route, BrowserRouter } from 'react-router-dom';
import Add from './add';
import Edit from './edit';
import Intro from './intro';
import Import from './import';
import Layout from './layout';
import Playlist from './playlist';
import Search from './search';
import Settings from './settings';
import Spotify from './spotify';
import Sync from './sync';

class RootViewLoader {
  static initialise() {
    render((
      <div>
        <BrowserRouter history={browserHistory}>
          <Layout>
            <Switch>
              <Route path='/add' component={Add} />
              <Route path='/edit/:id' component={Edit} />
              <Route path='/import' component={Import} />
              <Route path='/welcome' component={Intro} />
              <Route path='/settings' component={Settings} />
              <Route path='/spotify' component={Spotify} />
              <Route path='/sync' component={Sync} />
              <Route path='/playlist/:playlist' component={Playlist} />
              <Route path='/search/:search' component={Search} />
              <Route exact component={Intro} />
            </Switch>
          </Layout>
        </BrowserRouter>
      </div>
    ), document.getElementById('react'));
  }
}

module.exports = RootViewLoader;
