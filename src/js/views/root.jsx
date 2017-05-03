import { h, render } from 'preact';
import { IndexRedirect, Redirect, Router, Route, browserHistory } from 'react-router';
import Add from './add';
import Bootbox from '../services/bootbox';
import ContextMenu from '../views/context_menu';
import Intro from './intro';
import Layout from './layout';
import Playlist from './playlist';
import Settings from './settings';

class RootViewLoader {
  static initialise() {
    render((
      <div>
        <Router history={browserHistory}>
          <Route path="/" component={Layout}>
            <IndexRedirect to="welcome" />
            <Route path="add" component={Add} />
            <Route path="welcome" component={Intro} />
            <Route path="settings" component={Settings} />
            <Route path="playlist/:playlist" component={Playlist} />
            <Redirect from='*' to='/' />
          </Route>
        </Router>
        <Bootbox />
        <ContextMenu />
      </div>
    ), document.getElementById('preact'));
  }
}

module.exports = RootViewLoader;
