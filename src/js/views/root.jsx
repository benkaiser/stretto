import { h, render } from 'preact';
import IndexRedirect from 'react-router/lib/IndexRedirect';
import { browserHistory, Policy, Redirect, Route, Router } from 'react-router';
import Add from './add';
import Edit from './edit';
import Intro from './intro';
import Import from './import';
import Layout from './layout';
import Playlist from './playlist';
import Settings from './settings';
import Spotify from './spotify';
import Sync from './sync';

class RootViewLoader {
  static initialise() {
    render((
      <div>
        <Router history={browserHistory}>
          <Route path="/" component={Layout}>
            <IndexRedirect to="welcome" />
            <Route path="add" component={Add} />
            <Route path="edit/:id" component={Edit} />
            <Route path="import" component={Import} />
            <Route path="welcome" component={Intro} />
            <Route path="settings" component={Settings} />
            <Route path="spotify" component={Spotify} />
            <Route path="sync" component={Sync} />
            <Route path="playlist/:playlist" component={Playlist} />
            <Redirect from='*' to='/' />
          </Route>
        </Router>
      </div>
    ), document.getElementById('preact'));
  }
}

module.exports = RootViewLoader;
