import * as React from 'react';
import Player from '../services/player';
import autobind from 'autobind-decorator';
import PlayerControlsMobile from './player_controls_mobile';
// import { DropdownButton, Col, MenuItem, Panel, Row } from 'react-bootstrap';

export default class PlayerView extends React.Component {
  constructor(props) {
    super(props);
    Player.addOnSongChangeListener(this.newSong);
    this.state = {
      hideCover: false,
      song: Player.currentSong
    };
  }

  componentWillUnmount() {
    Player.removeOnSongChangeListener(this.newSong);
  }

  @autobind
  newSong(song) {
    this.setState({
      song: song
    });
  }

  render() {
    if (this.state.song) {
      return (
        <div className='player_view'>
          <img className='playerCover' crossOrigin='use-credentials' src={this.state.song.cover} />
          <div className='info'>
            <p className='title' title={this.state.song.title}>{this.state.song.title}</p>
            { this.state.song.artist &&
              <p className='artist'>
                <span className='searchable' onClick={this._search.bind(this, this.state.song.artist)}>{this.state.song.artist}</span>
              </p>
            }
            { this.state.song.album &&
              <p className='album'>
                <span className='searchable' onClick={this._search.bind(this, this.state.song.album)}>{this.state.song.album}</span>
              </p>
            }
          </div>
          <div className='controls'>
            <PlayerControlsMobile />
          </div>
        </div>
      );
    } else {
      return <div className='intro'>No song selected</div>;
    }
  }

  _search(searchText, event) {
    this.props.history.push(`/search/${searchText}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}
