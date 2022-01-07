import { render } from 'react-dom';
import * as React from 'react';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import { default as getHistory, ReactRouterGlobalHistory } from 'react-router-global-history';
import Add from './add';
import ArtistSuggestions from './artist_suggestions';
import ArtistsFeed from './artists_feed';
import ArtistsManage from './artists_manage';
import BackupRestore from './backup_restore';
import ExplicitScan from './explicit_scan';
import Discover from './discover';
import Edit from './edit';
import Error from './error';
import Intro from './intro';
import Layout from './layout';
import Playlist from './playlist';
import PlayerView from './player_view';
import Search from './search';
import Settings from './settings';
import SharedPlaylist from './shared_playlist';
import Soundcloud from './soundcloud';
import Spotify from './spotify';
import Sync from './sync';
import Remote from './remote';
import Reset from './reset';
import YoutubeMix from './youtube_mix';

class RegularRoutes extends React.Component {
  static getDerivedStateFromError() {
    return {};
  }

  componentDidCatch(error, errorInfo) {
    getHistory().replace('/error', {
      error,
      errorInfo
    });
  }

  render() {
    return (
      <Layout>
        <ReactRouterGlobalHistory />
        <Switch>
          <Route exact path='/error' component={Error} />
          <Route path='/add' component={Add} />
          <Route path='/edit/:id' component={Edit} />
          <Route path='/player' component={PlayerView} />
          <Route path='/backup' component={BackupRestore} />
          <Route path='/explicitscan' component={ExplicitScan} />
          <Route path='/welcome' component={Intro} />
          <Route path='/settings' component={Settings} />
          <Route path='/spotify' component={Spotify} />
          <Route path='/sync' component={Sync} />
          <Route path='/reset' component={Reset} />
          <Route path='/playlist/:playlist' component={Playlist} />
          <Route path='/search/' exact component={Search} />
          <Route path='/search/:search' component={Search} />
          <Route path='/mix/:playlist' component={YoutubeMix} />
          <Route path='/discover' component={Discover} />
          <Route path='/artists/feed' component={ArtistsFeed} />
          <Route path='/artists/add' component={ArtistSuggestions} />
          <Route path='/artists/manage' component={ArtistsManage} />
          <Route path='/soundcloud' component={Soundcloud} />
          <Route path='/shared/:guid' component={SharedPlaylist} />
          <Route exact component={Intro} />
        </Switch>
      </Layout>
    );
  }
}

export default class RootViewLoader {
  static initialise() {
    render((
      <div>
        <BrowserRouter>
          <Switch>
            <Route path='/remote' component={Remote} />
            <Route path='/' component={RegularRoutes} />
          </Switch>
        </BrowserRouter>
      </div>
    ), document.getElementById('react'));
  }
}
