import { render } from 'react-dom';
import * as React from 'react';
import { browserHistory, Switch, Route, BrowserRouter } from 'react-router-dom';
import { ReactRouterGlobalHistory } from 'react-router-global-history';
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
import Remote from './remote';

class RegularRoutes extends React.Component {
  render() {
    return (
      <Layout>
        <ReactRouterGlobalHistory />
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
    );
  }
}

class RootViewLoader {
  static initialise() {
    render((
      <div>
        <BrowserRouter history={browserHistory}>
          <Switch>
            <Route path='/remote' component={Remote} />
            <Route path='/' component={RegularRoutes} />
          </Switch>
        </BrowserRouter>
      </div>
    ), document.getElementById('react'));
  }
}

module.exports = RootViewLoader;
