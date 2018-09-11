import * as React from 'react';
import { Link } from 'react-router-dom';

class Intro extends React.Component {
  render() {
    return (
      <div className='intro'>
        <h1>Welcome to Stretto</h1>
        <p>Here's a basic run down of why you should use Stretto</p>
        <h3><i className='fa fa-youtube' aria-hidden='true'></i> Massive Library</h3>
        <p>Your library becomes all of youtube and soundcloud. Millions of songs at the end of your fingertips.</p>
        <h3><i className='fa fa-headphones' aria-hidden='true'></i> Unlimited Ad-Free Listening</h3>
        <p>
          Listen to the music you love, uninterupted thanks to ad blockers (
          <a target='_blank' href='https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm?hl=en'>uBlock Origin Chrome</a>
          {' - '}
          <a target='_blank' href='https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/'>uBlock Origin Firefox</a>
          ).
        </p>
        <h3><i className='fa fa-github' aria-hidden='true'></i> Open Source</h3>
        <p>Built by members of the community in the open on <a href='https://github.com/benkaiser/stretto'>Github</a>.</p>
        <h3><i className='fa fa-arrow-right' aria-hidden='true'></i> How do I add my music?</h3>
        <p>There are a bunch of options, you can <Link to='/add/'>add them individually</Link> from youtube or soundcloud links.<br/>You can <Link to='/spotify/'>add them in bulk from Spotify</Link> or from <Link to='/import/'>Stretto 1.x</Link>.</p>
      </div>
    );
  }
}

module.exports = Intro;
