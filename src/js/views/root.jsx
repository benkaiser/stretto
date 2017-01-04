import { h, render } from 'preact';
import { IndexRedirect, Redirect, Router, Route, browserHistory } from 'react-router';
import Intro from './intro';
import Layout from './layout';
import Playlist from './playlist';
import Settings from './settings';

class RootViewLoader {
  static initialise() {
    render((
      <Router history={browserHistory}>
        <Route path="/" component={Layout}>
          <IndexRedirect to="welcome" />
          <Route path="welcome" component={Intro} />
          <Route path="settings" component={Settings} />
          <Route path="playlist/:playlist" component={Playlist} />
          <Redirect from='*' to='/' />
        </Route>
      </Router>
    ), document.getElementById('preact'));
  }
}

module.exports = RootViewLoader;
