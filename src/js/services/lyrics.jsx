import * as React from 'react';
import Player from '../services/player';
import Bootbox from './bootbox';

const LYRIC_WAIT_TIMEOUT = 500;
const SYNC_POLL_MS = 250;

const listeners = [];

function parseSynced(lrc) {
  if (!lrc) return null;
  const lines = [];
  lrc.split('\n').forEach((raw) => {
    const stamps = raw.match(/\[\d+:\d+(?:\.\d+)?\]/g);
    if (!stamps) return;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    stamps.forEach((stamp) => {
      const [, min, sec] = stamp.match(/\[(\d+):(\d+(?:\.\d+)?)\]/);
      lines.push({ time: parseInt(min, 10) * 60 + parseFloat(sec), text });
    });
  });
  lines.sort((a, b) => a.time - b.time);
  return lines.length ? lines : null;
}

class LyricsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { active: -1 };
    this._lineRefs = [];
  }

  componentDidMount() {
    if (this.props.synced) {
      this._interval = setInterval(() => this._poll(), SYNC_POLL_MS);
    }
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  componentDidUpdate(_, prevState) {
    if (prevState.active !== this.state.active && this._lineRefs[this.state.active]) {
      this._lineRefs[this.state.active].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  _poll() {
    const { songId, synced } = this.props;
    const visible = this._container && this._container.offsetParent !== null;
    if (!visible || !Player.currentSong || Player.currentSong.id !== songId) {
      if (this.state.active !== -1) this.setState({ active: -1 });
      return;
    }
    Player.currentTimeAbsolute().then((position) => {
      let active = -1;
      for (let i = 0; i < synced.length && synced[i].time <= position; i++) {
        active = i;
      }
      if (active !== this.state.active) this.setState({ active });
    });
  }

  render() {
    const { synced, plain } = this.props;
    if (!synced) {
      return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1 }}>{plain}</div>;
    }
    return (
      <div ref={(el) => this._container = el} style={{ lineHeight: 1.4 }}>
        {synced.map((line, i) => (
          <div
            key={i}
            ref={(el) => this._lineRefs[i] = el}
            style={i === this.state.active ?
              { fontWeight: 'bold', fontSize: '1.15em', color: '#18bc9c' } :
              { opacity: 0.7 }}>
            {line.text || '\u00a0'}
          </div>
        ))}
      </div>
    );
  }
}

export default class Lyrics {
  static get lyrics() {
    return this._lyrics;
  }

  static get status() {
    return this._status;
  }

  static initialise() {
    Player.addOnSongChangeListener(this._onSongChange.bind(this));
  }

  static addListener(listener) {
    listeners.push(listener);
  }

  static removeListener(listener) {
    listeners.splice(listeners.indexOf(listener), 1);
  }

  static show() {
    if (this._status === 'failed') {
      this.showFailure();
      return;
    }
    Bootbox.show('Lyrics', <LyricsView
      key={this._songId}
      songId={this._songId}
      plain={this._lyrics}
      synced={this._synced} />);
  }

  static showFailure() {
    Bootbox.show('Lyrics unavailable', <div>
      <p>We couldn't fetch lyrics for this song right now. Please try again later.</p>
    </div>);
  }

  static _onSongChange(newSong) {
    this._lyrics = undefined;
    this._synced = undefined;
    this._status = undefined;
    this._songId = newSong.id;
    this._change();
    this._songTimeout && clearTimeout(this._songTimeout);
    const requestedId = newSong.id;
    this._songTimeout = setTimeout(() => {
      this._fetchLyrics(newSong).catch((error) => {
        if (this._songId !== requestedId) return;
        console.log('Unable to fetch lyrics for song');
        console.log(error);
        this._status = 'failed';
        this._change();
      });
    }, LYRIC_WAIT_TIMEOUT);
  }

  static _fetchLyrics(song) {
    const params = new URLSearchParams({
      id: song.id,
      title: song.title || '',
      artist: song.artist || '',
      duration: song.duration || 0
    });
    return fetch(`/lyrics?${params}`).then((response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`lyrics ${response.status}`);
      return response.json();
    }).then((result) => {
      if (this._songId !== song.id) return;
      if (!result) {
        this._status = 'notfound';
      } else {
        this._synced = parseSynced(result.syncedLyrics);
        this._lyrics = result.lyrics || (this._synced && this._synced.map(l => l.text).join('\n'));
        this._status = this._lyrics ? 'found' : 'notfound';
      }
      this._change();
    });
  }

  static _change() {
    listeners.forEach((listener) => {
      try {
        listener instanceof Function && listener();
      } catch(error) {
        console.log('Error notifying Lyric listener');
        console.log(error);
      }
    });
  }
}
