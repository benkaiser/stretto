import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import Bootbox from '../services/bootbox';
import ContextMenu from './context_menu';
import * as React from 'react';
import Player from '../services/player';
import Playlist, { SortDirection } from '../models/playlist';
import autobind from 'autobind-decorator';
import moment from 'moment';

const COLUMNS = ['title', 'artist', 'album', 'createdAt'];

const COLUMN_TITLE_MAPPING = {
  'title': 'Title',
  'artist': 'Artist',
  'album': 'Album',
  'createdAt': 'Date Added'
};
const COLUMN_WIDTH_MAPPING = {
  'title': 0.3,
  'artist': 0.25,
  'album': 0.25,
  'createdAt': 0.2
}
const ELEMENT_HEIGHT = 41;
const HEADER_HEIGHT = 50;

class PlaylistView extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromprops(props);
    this.SortableContainer = SortableContainer(createSortableList(this), { withRef: true });
    this.SortableElement = SortableElement(this.sortableItem);
    Player.addOnSongChangeListener(this.songChange);
    Playlist.addOnChangeListener(this.songChange);
  }

  componentDidMount() {
    this.contentContainer().addEventListener('scroll', this.onScroll);
    PlaylistView.lastScrollTop && this.scrollAndReset();
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
              { COLUMNS.map((column) => this.headerForColumn(column)) }
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
      </div>
    );
  }

  cellWidthForColumn(column) {
    return COLUMN_WIDTH_MAPPING[column] * this.state.width;
  }

  clickSong(song) {
    Player.play(song, this.state.playlist);
    this.setState();
  }

  contentContainer() {
    return document.getElementsByClassName('content')[0];
  }

  determineStateForElementsToShow(scrollTop, containerHeight, playlist) {
    const scrollTopMinusHeader = scrollTop - HEADER_HEIGHT;
    const numSongs = playlist.songData.length;
    const numElements = Math.floor(containerHeight / ELEMENT_HEIGHT) + 20;
    const firstIndex = Math.max(Math.floor(scrollTopMinusHeader / ELEMENT_HEIGHT) - 10, 0);
    const lastIndex = Math.min(firstIndex + numElements, numSongs);
    const songs = playlist.songData.slice(firstIndex, lastIndex);
    return {
      scrollTop,
      firstIndex: firstIndex,
      songsToRender: songs,
      topSpacerHeight: firstIndex * ELEMENT_HEIGHT,
      bottomSpacerHeight: (playlist.songData.length - lastIndex) * ELEMENT_HEIGHT
    };
  }

  getStateFromprops(props) {
    const playlist = Playlist.getByTitle(props.match.params.playlist);
    const state = this.determineStateForElementsToShow(0, window.innerHeight, playlist);
    state.sortColumn = playlist.sortColumn || undefined;
    state.sortDirection = playlist.sortDirection || SortDirection.NONE;
    state.playlist = playlist;
    state.width = this.state ? this.state.width : 1000;
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
        {COLUMN_TITLE_MAPPING[column]}
        { ' ' }
        { this.sortIconFor(column) }
      </th>
    );
  }

  isCurrentSongPlaying(songId) {
    let currentSongId = Player.currentSong ? Player.currentSong.id : '';
    return songId === currentSongId;
  }

  itemForColumn(column, song) {
    const props = {
      style: {
        width: `${this.cellWidthForColumn(column)}px`
      }
    };
    const key = column;
    switch (column) {
      case 'title':
        return (
          <td key={key} {...props}>
            <div className='cover' style={{'backgroundImage': `url('${song.cover}')`}}></div>
            {song.title}
          </td>
        );
        break;
      case 'createdAt':
      case 'updatedAt':
        return <td key={key} {...props}>{moment(song[column]).fromNow()}</td>;
        break;
      case 'artist':
      case 'album':
        return <td key={key} {...props} onClick={this._searchFor.bind(this, song[column])} role='link' className='searchable'>{song[column]}</td>;
      default:
        return <td key={key} {...props}>{song[column]}</td>;
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
  onScroll(event) {
    this._mounted && this.setState(this.determineStateForElementsToShow(event.target.scrollTop, event.target.clientHeight, this.state.playlist));
  }

  @autobind
  onSortEnd({oldIndex, newIndex}) {
    this.state.playlist.reorder(oldIndex, newIndex);
    const scrollContainer = this.contentContainer();
    this.setState(this.determineStateForElementsToShow(scrollContainer.scrollTop, scrollContainer.clientHeight, this.state.playlist));
  }

  rightClickSong(song, event) {
    ContextMenu.open(song, event, this.state.playlist);
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
    if (!this.state.playlist.editable || this.state.sortDirection !== SortDirection.NONE) {
      return true;
    }
  }

  @autobind
  songChange() {
    const scrollContainer = this.contentContainer();
    this.setState(this.determineStateForElementsToShow(scrollContainer.scrollTop, scrollContainer.clientHeight, this.state.playlist));
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
      <tr className={ this.isCurrentSongPlaying(value.id) ? 'bg-primary' : '' }
          onClick={this.clickSong.bind(this, value)}
          onContextMenu={this.rightClickSong.bind(this, value)}>
        { COLUMNS.map((column) => this.itemForColumn(column, value)) }
      </tr>
    );
  }

  @autobind
  sortableList({items}) {
    return (
      <tbody>
        <tr height={this.state.topSpacerHeight}></tr>
        {items.map((value, index) =>
          <this.SortableElement key={`item-${value.id}`} index={this.state.firstIndex + index} value={value} />
        )}
        <tr height={this.state.bottomSpacerHeight}></tr>
      </tbody>
    );
  }

  _searchFor(searchText, event) {
    this.props.history.push(`/search/${searchText}`);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}

function createSortableList(parentRef) {
  return class SortableList extends React.Component {
    render() {
      return (
        <tbody>
          <tr height={parentRef.state.topSpacerHeight}></tr>
          {this.props.items.map((value, index) =>
            <parentRef.SortableElement key={`item-${value.id}`} index={parentRef.state.firstIndex + index} value={value} />
          )}
          <tr height={parentRef.state.bottomSpacerHeight}></tr>
        </tbody>
      );
    }
  }
}


module.exports = PlaylistView;
