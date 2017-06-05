import { h, render } from 'preact';
import IndexRedirect from 'react-router/lib/IndexRedirect';
import Redirect from 'react-router/lib/Redirect';
import Router from 'react-router/lib/Router';
import Route from 'react-router/lib/Route';
import browserHistory from 'react-router/lib/browserHistory';
import Add from './add';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';
import Intro from './intro';
import Import from './import';
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
            <Route path="import" component={Import} />
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
