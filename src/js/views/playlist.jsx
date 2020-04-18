import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Button, Label, DropdownButton, MenuItem } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import moment from 'moment';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';
import * as React from 'react';
import Lyrics from '../services/lyrics';
import Player from '../services/player';
import Playlist, { SortDirection } from '../models/playlist';
import Alerter from '../services/alerter';
import Utilities from '../utilities';

const ELEMENT_HEIGHT = 40;
const HEADER_HEIGHT = 50;

export default class PlaylistView extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromprops(props);
    this.SortableContainer = SortableContainer(createSortableList(this), { withRef: true });
    this.SortableElement = SortableElement(this.sortableItem);
    this._lastRenderScrollTop = 0;
    Player.addOnSongChangeListener(this.songChange);
    Playlist.addOnChangeListener(this.songChange);
  }

  componentDidMount() {
    this.contentContainer().addEventListener('scroll', this.onScroll);
    PlaylistView.lastScrollTop && this.scrollAndReset();
    Lyrics.addListener(this._onLyricsFound);
    this.setState({
      width: this.contentContainer().width
    });
    this._mounted = true;
  }

  componentWillReceiveProps(props) {
    this.setState(this.getStateFromprops(props));
  }

  componentWillUnmount() {
    PlaylistView.lastScrollTop = this.state.scrollTop;
    this.contentContainer().removeEventListener('scroll', this.onScroll);
    Player.removeOnSongChangeListener(this.songChange);
    Playlist.removeOnChangeListener(this.songChange);
    Lyrics.removeListener(this._onLyricsFound);
    this._mounted = false;
  }

  render() {
    return (
      <div className='intro'>
        { this.header() }
        <p>{this.state.playlist.songs.length} Songs</p>
        <table className='song-table table'>
          <thead>
            <tr>
              { this.getColumns().map((column) => this.headerForColumn(column)) }
            </tr>
          </thead>
          <this.SortableContainer
            getContainer={wrappedInstance => this.contentContainer()}
            distance={20}
            helperclassName='sortableElement'
            items={this.state.songsToRender}
            onSortEnd={this.onSortEnd}
            shouldCancelStart={this.shouldCancelSortStart}
            transitionDuration={0}
          />
        </table>
        { this.allowPagination &&
          this.allowPagination() &&
          <Button
            bsStyle='primary'
            className={'paginate ' + (this.state.atBottom ? 'slideInUp' : 'slideOutDown')}
            onClick={this.paginationCallback.bind(this)}
          >
            Load More
          </Button> }
      </div>
    );
  }

  cellWidthForColumn(column) {
    return this.columnWidthMappings()[column] * this.state.width;
  }

  clickSong(song, event) {
    if (event.ctrlKey) {
      if (this.state.selected.includes(song.id)) {
        this.setState({
          selected: this.state.selected.filter(id => song.id !== id)
        });
      } else {
        this.setState({
          selected: [...this.state.selected, song.id],
          lastSelected: song.id
        });
      }
      return;
    } else if (event.shiftKey) {
      this.setState({
        selected: [
          ...this.state.selected,
          ...this._songsIdsBetween(
            song.id, this.state.lastSelected || (Player.currentSong ? Player.currentSong.id : '')
          ).filter(id => !this.state.selected.includes(id))
        ],
        lastSelected: song.id
      });
      return;
    } else {
      this.setState({
        selected: [song.id],
        lastSelected: song.id
      })
      const promise = Player.play(song, this.state.playlist)
      if (song.deferred) {
        promise.then(() => {
          this.setState({
            selected: [ song.id ],
            lastSelected: song.id
          });
        });
      }
    }
  }

  contentContainer() {
    return this._contentContainer || (this._contentContainer = document.getElementsByClassName('content')[0]);
  }

  determineStateForElementsToShow(scrollTop, containerHeight, playlist) {
    const scrollTopMinusHeader = scrollTop - HEADER_HEIGHT;
    const numSongs = playlist.songData.length;
    const numElements = Math.floor(containerHeight / ELEMENT_HEIGHT) + 20;
    const firstIndex = Math.max(Math.floor(scrollTopMinusHeader / ELEMENT_HEIGHT) - 10, 0);
    const lastIndex = Math.min(firstIndex + numElements, numSongs);
    const songs = playlist.songData.slice(firstIndex, lastIndex);
    const container = this.contentContainer();
    return {
      scrollTop,
      firstIndex: firstIndex,
      songsToRender: songs,
      topSpacerHeight: firstIndex * ELEMENT_HEIGHT,
      bottomSpacerHeight: (playlist.songData.length - lastIndex) * ELEMENT_HEIGHT,
      atBottom: container ? scrollTop > container.scrollHeight - container.offsetHeight - 100 : false
    };
  }

  getPlaylistFromProps(props) {
    return Playlist.getByTitle(decodeURIComponent(props.match.params.playlist));
  }

  getStateFromprops(props) {
    const playlist = this.getPlaylistFromProps(props);
    const state = this.determineStateForElementsToShow(0, window.innerHeight, playlist);
    state.sortColumn = playlist.sortColumn || undefined;
    state.sortDirection = playlist.sortDirection || SortDirection.NONE;
    state.playlist = playlist;
    state.width = this.state ? this.state.width : 1000;
    state.selected = [];
    state.lastSelected = undefined;
    return state;
  }

  header() {
    return (
      <div className='playlist_header'>
        <h1>{this.state.playlist.title}</h1>
        { this.state.playlist.editable && this.headerButtons() }
      </div>
    );
  }

  headerButtons() {
    return (
      <div>
        <DropdownButton id='playlist-dropdown' title='Options'>
          <MenuItem onClick={this.onDelete}>Delete playlist</MenuItem>
          <MenuItem onClick={this.onRename}>Rename playlist</MenuItem>
          <MenuItem onClick={this.sharePlaylist}>Share Playlist</MenuItem>
        </DropdownButton>
      </div>
    );
  }

  headerForColumn(column) {
    return (
      <th
        key={'header_' + column}
        className={`${column}Column`}
        onClick={() => this.sortBy(column)}>
        {this.columnTitleMappings()[column]}
        { ' ' }
        { this.sortIconFor(column) }
      </th>
    );
  }

  isCurrentlyPlaying(songId) {
    return songId === (Player.currentSong ? Player.currentSong.id : '');
  }

  isSelected(songId) {
    return this.state.selected.includes(songId);
  }

  itemForColumn(column, song) {
    const key = column;
    switch (column) {
      case 'title':
        return (
          <td className='titleItemColumn' key={key}>
            <div className='cover' style={{'backgroundImage': `url('${song.cover}')`}}></div>
            <div className='titleItemText'>{song.title}</div>
            { this.isCurrentlyPlaying(song.id) && Lyrics.lyrics && this._lyricsButton() }
          </td>
        );
      case 'releaseDate':
      case 'createdAt':
      case 'updatedAt':
        return <td key={key}>{moment(song[column]).fromNow()}</td>;
      case 'artist':
      case 'album':
        return <td key={key} onClick={this._searchFor.bind(this, song[column])} role='link' className='searchable'>{song[column]}</td>;
      case 'duration':
        return <td key={key}>{Utilities.timeFormat(~~song[column])}</td>;
      default:
        return <td key={key}>{song[column]}</td>;
    }
  }

  @autobind
  onDelete() {
    Bootbox.confirm('Are you sure you want to delete this playlist?').then(() => {
      Playlist.remove(this.state.playlist);
      this.props.history.push('/playlist/' + Playlist.LIBRARY);
    });
  }

  @autobind
  onRename() {
    Bootbox.prompt('What would you like to rename your playlist to?', {
      value: this.state.playlist.title
    }).then((newTitle) => {
      this.state.playlist.update('title', newTitle);
      this.props.history.push('/playlist/' + newTitle);
    });
  }

  @autobind
  sharePlaylist() {
    Alerter.info('Uploading...');
    return fetch('/share', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist:  this.state.playlist.exportShare()
      })
    })
    .then(Utilities.fetchToJson)
    .then((data) => {
      Bootbox.show('Playlist Link', <p>Here is the link to your <a href={'/shared/' + data.guid}>Shared Playlist</a></p>);
    });
  }

  @autobind
  onScroll(event) {
    if (Math.abs(this._lastRenderScrollTop - event.currentTarget.scrollTop) > ELEMENT_HEIGHT) {
      this._lastRenderScrollTop = event.currentTarget.scrollTop;
      this._mounted && this.setState(this.determineStateForElementsToShow(event.currentTarget.scrollTop, event.currentTarget.clientHeight, this.state.playlist));
    }
  }

  @autobind
  onSortEnd({oldIndex, newIndex}) {
    this.state.playlist.reorder(oldIndex, newIndex);
    const scrollContainer = this.contentContainer();
    this.setState(this.determineStateForElementsToShow(scrollContainer.scrollTop, scrollContainer.clientHeight, this.state.playlist));
  }

  rightClickSong(song, event) {
    ContextMenu.open(this._contextMenuItems(song), event, this.state.playlist);
    event.preventDefault();
  }

  scrollAndReset() {
    setTimeout(() => {
      this.contentContainer().scrollTop = PlaylistView.lastScrollTop;
      delete PlaylistView.lastScrollTop;
    }, 0);
  }

  @autobind
  shouldCancelSortStart() {
    if (!this.state.playlist.editable || this.state.sortDirection !== SortDirection.NONE || this._isAndroid()) {
      return true;
    }
  }

  _isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
  }

  @autobind
  songChange() {
    const scrollContainer = this.contentContainer();
    this.setState({
      ...this.determineStateForElementsToShow(scrollContainer.scrollTop, scrollContainer.clientHeight, this.state.playlist),
      ...this._newSelectedState(Player.currentSong && Player.currentSong ? Player.currentSong.id : '')
    });
  }

  @autobind
  sortBy(column) {
    let nextSortDirection = this.state.sortDirection;
    if (column != this.state.sortColumn) {
      nextSortDirection = SortDirection.ASCENDING;
    } else {
      nextSortDirection = (nextSortDirection + 1) % Object.keys(SortDirection).length;
    }
    this.state.playlist.sortBy(column, nextSortDirection);
    const newScrollState = this.determineStateForElementsToShow(0, window.innerHeight, this.state.playlist);
    newScrollState.sortColumn = column;
    newScrollState.sortDirection = nextSortDirection;
    this.setState(newScrollState);
  }

  sortIconFor(column) {
    if (this.state.sortColumn === column && this.state.sortDirection !== SortDirection.NONE) {
      return this.state.sortDirection === SortDirection.ASCENDING ?
        <i className='fa fa-chevron-up' aria-label='Sorting Ascending'></i> :
        <i className='fa fa-chevron-down' aria-label='Sorting Descending'></i>;
    }
  }

  @autobind
  sortableItem({value}) {
    return (
      <tr className={ this._classForId(value.id) }
          onClick={this.clickSong.bind(this, value)}
          onContextMenu={this.rightClickSong.bind(this, value)}>
        { this.getColumns().map((column) => this.itemForColumn(column, value)) }
      </tr>
    );
  }

  _lyricsButton() {
    return (
      <div className='lyric-label'>
        <Label bsStyle="info" onClick={this._onLyricsClick}>Lyrics</Label>
      </div>
    );
  }

  @autobind
  _onLyricsClick(event) {
    Lyrics.show();
    event.preventDefault();
    event.stopPropagation();
  }

  @autobind
  _onLyricsFound() {
    this.forceUpdate();
  }

  _searchFor(searchText, event) {
    this.props.history.push(`/search/${searchText}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  _songsIdsBetween(firstId, secondId) {
    const firstIndex = this.state.playlist.songData.findIndex(song => song.id === firstId);
    const secondIndex = this.state.playlist.songData.findIndex(song => song.id === secondId);
    if (firstIndex >= 0 && secondIndex >= 0) {
      return this.state.playlist.songData.slice(Math.min(firstIndex, secondIndex), Math.max(firstIndex, secondIndex) + 1).map(song => song.id);
    } else {
      return [firstId, secondId];
    }
  }

  _newSelectedState(newSongId) {
    if (this.state.selected.length > 1) {
      return {};
    } else {
      return {
        selected: [newSongId],
        lastSelected: newSongId
      };
    }
  }

  _classForId(id) {
    if (this.state.selected.length > 1 || this.state.selected[0] && !this.isCurrentlyPlaying(this.state.selected[0])) {
      return this.isSelected(id) ? 'bg-info' : '';
    } else {
      return this.isCurrentlyPlaying(id) ? 'bg-primary' : '';
    }
  }

  _contextMenuItems(song) {
    if (this.state.selected.length > 1) {
      return this.state.selected.map(id => this.state.playlist.songData.find(song => song.id === id));
    } else {
      return [song];
    }
  }

  getColumns() {
    return ['title', 'artist', 'album', 'createdAt'];
  }

  columnTitleMappings() {
    return {
      'title': 'Title',
      'artist': 'Artist',
      'album': 'Album',
      'createdAt': 'Date Added'
    };
  }

  columnWidthMappings() {
    return {
      'title': 0.3,
      'artist': 0.25,
      'album': 0.25,
      'createdAt': 0.2
    };
  }
}

function createSortableList(parentRef) {
  return class SortableList extends React.Component {
    render() {
      return (
        <tbody>
          <tr className="spacer" height={parentRef.state.topSpacerHeight}></tr>
          {this.props.items.map((value, index) =>
            <parentRef.SortableElement key={`item-${value.id}`} index={parentRef.state.firstIndex + index} value={value} />
          )}
          <tr className="spacer" height={parentRef.state.bottomSpacerHeight}></tr>
        </tbody>
      );
    }
  }
}