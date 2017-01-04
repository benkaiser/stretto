import { h, Component } from 'preact';

class Intro extends Component {
  render() {
    return (
      <div class='intro'>
        <h1>Welcome to Stretto</h1>
        <p>Here's a basic run down of why you should use Stretto</p>
        <h3><i class="fa fa-youtube" aria-hidden="true"></i> Massive Library</h3>
        <p>Your library becomes all of youtube and soundcloud. Millions of songs at the end of your fingertips.</p>
        <h3><i class="fa fa-headphones" aria-hidden="true"></i> Unlimited Ad-Free Listening</h3>
        <p>
          Listen to the music you love, uninterupted (Ad Blocker required
          {' - ' }
          <a target='_blank' href='https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm?hl=en'>uBlock Origin Chrome</a>
          {' - '}
          <a target='_blank' href='https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/'>uBlock Origin Firefox</a>
          ).
        </p>
        <h3><i class="fa fa-github" aria-hidden="true"></i> Open Source</h3>
        <p>Built by members of the community in the open on <a href='https://github.com/benkaiser/stretto'>Github</a>.</p>
        <h3><i class="fa fa-arrow-right" aria-hidden="true"></i> How do I start?</h3>
        <p>You already have! This webpage is Stretto, click the Explore button on the left to start adding music to your library.</p>
      </div>
    );
  }
}

module.exports = Intro;
