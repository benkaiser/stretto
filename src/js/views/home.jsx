import * as React from 'react';
import { withRouter } from 'react-router-dom';
import Playlist from '../models/playlist';
import Song from '../models/song';

const RECENT_KEY = 'recentPlaylistsOrder';

function getRecentOrder() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function setRecentOrder(order) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(order));
}

function getPlaylistCoverImages(playlist) {
  const songs = playlist.songData.slice(0, 4);
  if (songs.length < 4) {
    // Use the first song's cover (or fallback) for all 4 cells
    const cover = songs[0] && songs[0].cover ? songs[0].cover : '/static/assets/icon192.png';
    return [cover, cover, cover, cover];
  }
  return songs.map(song => song && song.cover ? song.cover : '/static/assets/icon192.png');
}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playlists: Playlist.fetchAll(),
      recentOrder: getRecentOrder(),
    };
  }

  handleTileClick = (playlist) => {
    // Update recent order
    let { recentOrder } = this.state;
    recentOrder = [playlist.title, ...recentOrder.filter(t => t !== playlist.title)];
    setRecentOrder(recentOrder);
    this.setState({ recentOrder });
    this.props.history.push(`/playlist/${encodeURIComponent(playlist.title)}`);
  };

  getOrderedPlaylists() {
    const all = Playlist.fetchAll();
    const byTitle = {};
    all.forEach(p => { byTitle[p.title] = p; });
    // Library always first
    const library = byTitle[Playlist.LIBRARY];
    let rest = all.filter(p => p.title !== Playlist.LIBRARY);
    // Order by recentOrder, but skip Library if present
    const { recentOrder } = this.state;
    rest = recentOrder
      .filter(title => title !== Playlist.LIBRARY)
      .map(title => byTitle[title])
      .filter(Boolean)
      .concat(rest.filter(p => !recentOrder.includes(p.title)));
    return [library, ...rest];
  }

  render() {
    const playlists = this.getOrderedPlaylists();
    return (
      <div className="home-tiles-container">
        {playlists.map((playlist, idx) => (
          <div
            className="playlist-tile"
            key={playlist.title}
            onClick={() => this.handleTileClick(playlist)}
          >
            <div className="playlist-tile-art">
              {(() => {
                const covers = getPlaylistCoverImages(playlist);
                return (
                  <div className="cover-grid">
                    {covers.map((url, i) => (
                      <div
                        className="cover-cell"
                        key={i}
                        style={{ backgroundImage: `url(${url})` }}
                      />
                    ))}
                  </div>
                );
              })()}
              <div className="tile-overlay" />
              <div className="tile-title">{playlist.title}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default withRouter(Home);
